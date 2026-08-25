package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var tmpl = template.Must(template.ParseFiles("templates/index.html"))

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	ID   string
	Conn *websocket.Conn
}

type Message struct {
	Type    string   `json:"type"`
	Devices []string `json:"devices,omitempty"`
	ID      string   `json:"id,omitempty"`
}

var (
	clients   = make(map[string]*Client)
	clientsMu sync.Mutex
	nextID    int
)

func homeHandler(w http.ResponseWriter, r *http.Request) {
	err := tmpl.Execute(w, nil)
	if err != nil {
		http.Error(w, "Failed to render page", http.StatusInternalServerError)
	}
}

func broadcastDeviceList() {
	clientsMu.Lock()

	deviceIDs := make([]string, 0, len(clients))
	for id := range clients {
		deviceIDs = append(deviceIDs, id)
	}

	message := Message{
		Type:    "devices",
		Devices: deviceIDs,
	}

	data, err := json.Marshal(message)
	if err != nil {
		clientsMu.Unlock()
		log.Println("Failed to encode device list:", err)
		return
	}

	// Make a copy of the clients so we don't keep the mutex
	// locked while writing to network connections.
	connections := make([]*websocket.Conn, 0, len(clients))
	for _, client := range clients {
		connections = append(connections, client.Conn)
	}

	clientsMu.Unlock()

	for _, conn := range connections {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Println("Failed to send device list:", err)
		}
	}
}

func websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}
	defer conn.Close()

	clientsMu.Lock()

	nextID++
	deviceID := fmt.Sprintf("Device-%d", nextID)

	clients[deviceID] = &Client{
		ID:   deviceID,
		Conn: conn,
	}

	clientsMu.Unlock()

	log.Printf("%s connected", deviceID)

	// Tell the newly connected browser its own ID.
	hello := Message{
		Type: "identity",
		ID:   deviceID,
	}

	data, err := json.Marshal(hello)
	if err != nil {
		log.Println("Failed to encode identity:", err)
		return
	}

	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Println("Failed to send identity:", err)
		return
	}

	// Tell everyone about the new device.
	broadcastDeviceList()

	// Wait for the browser to disconnect.
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}

	clientsMu.Lock()
	delete(clients, deviceID)
	clientsMu.Unlock()

	log.Printf("%s disconnected", deviceID)

	// Tell everyone that this device disappeared.
	broadcastDeviceList()
}

func main() {
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/ws", websocketHandler)

	static := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", static))

	log.Println("Server listening on http://0.0.0.0:3000")

	if err := http.ListenAndServe("0.0.0.0:3000", nil); err != nil {
		log.Fatal(err)
	}
}

package main

import (
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

// Connected clients.
// Key   = device ID
// Value = WebSocket connection
var clients = make(map[string]*websocket.Conn)

// Protects the clients map from concurrent access.
var clientsMu sync.Mutex

var nextID int

func homeHandler(w http.ResponseWriter, r *http.Request) {
	err := tmpl.Execute(w, nil)
	if err != nil {
		http.Error(w, "Failed to render page", http.StatusInternalServerError)
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

	clients[deviceID] = conn
	clientsMu.Unlock()

	log.Printf("%s connected", deviceID)

	err = conn.WriteMessage(
		websocket.TextMessage,
		[]byte("Your device ID: "+deviceID),
	)
	if err != nil {
		log.Println("Failed to send device ID:", err)
	}

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
}

func main() {
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/ws", websocketHandler)

	static := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", static))

	log.Println("Server listening on http://0.0.0.0:3000")

	if err := http.ListenAndServe(":3000", nil); err != nil {
		log.Fatal(err)
	}
}

package main

import (
	"html/template"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var tmpl = template.Must(template.ParseFiles("templates/index.html"))

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

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

	log.Println("Browser connected via WebSocket")

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Browser disconnected")
			return
		}

		log.Printf("Received: %s\n", message)
		err = conn.WriteMessage(messageType, message)
		if err != nil {
			log.Println("Failed to send message:", err)
			return
		}
	}
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

package main

import (
	"html/template"
	"log"
	"net/http"
)

var tmpl = template.Must(template.ParseFiles("templates/index.html"))

func homeHandler(w http.ResponseWriter, r *http.Request) {
	err := tmpl.Execute(w, nil)
	if err != nil {
		http.Error(w, "Failed to render page", http.StatusInternalServerError)
	}
}

func main() {
	http.HandleFunc("/", homeHandler)

	static := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", static))

	log.Println("Server listening on http://0.0.0.0:3000")

	if err := http.ListenAndServe(":3000", nil); err != nil {
		log.Fatal(err)
	}
}

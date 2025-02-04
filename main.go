package main

import (
	"html/template"
	"log"
	"net/http"
	"os"
	"path"
)

func main() {
	http.HandleFunc("/assets/", func(w http.ResponseWriter, r *http.Request) {
		if _, err := os.Stat(path.Join("./web", r.URL.Path)); os.IsNotExist(err) {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		} else if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			log.Printf("Error checking file: %v", err)
			return
		}
		http.ServeFile(w, r, path.Join("./web", r.URL.Path))
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := template.ParseFiles("./web/index.html")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		err = tmpl.Execute(w, nil)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	log.Println("http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

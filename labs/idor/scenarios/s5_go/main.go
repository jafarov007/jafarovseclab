package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
)

type User struct {
	UserID   int    `json:"user_id"`
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type ResetToken struct {
	Token  string
	UserID int
}

var (
	users = map[int]*User{
		995043202: {
			UserID:   995043202,
			Email:    "user.a@example.com",
			Password: "password123",
			FullName: "Alice Whitfield",
			Role:     "Administrator",
		},
		552450897: {
			UserID:   552450897,
			Email:    "user.b@example.com",
			Password: "password123",
			FullName: "Bob Martinez",
			Role:     "Operator",
		},
	}

	resetTokens = map[string]*ResetToken{
		"reset_tok_user_b_881923": {
			Token:  "reset_tok_user_b_881923",
			UserID: 552450897,
		},
		"reset_tok_user_a_994012": {
			Token:  "reset_tok_user_a_994012",
			UserID: 995043202,
		},
	}

	sessions = map[string]int{
		"session_b": 552450897,
		"session_a": 995043202,
	}

	mu sync.Mutex
)

func getSessionUser(r *http.Request) (int, bool) {
	cookie, err := r.Cookie("s5_session")
	if err != nil {
		return 0, false
	}
	userID, exists := sessions[cookie.Value]
	return userID, exists
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var errorText string
	if r.Method == "POST" {
		r.ParseForm()
		email := r.FormValue("email")
		password := r.FormValue("password")
		var matchedUser *User
		for _, u := range users {
			if (u.Email == email || (email == "user.b@example.com" && u.UserID == 552450897) || (email == "user.a@example.com" && u.UserID == 995043202)) && u.Password == password {
				matchedUser = u
				break
			}
		}
		if matchedUser != nil {
			token := "session_b"
			if matchedUser.UserID == 995043202 {
				token = "session_a"
			}
			http.SetCookie(w, &http.Cookie{Name: "s5_session", Value: token, Path: "/"})
			ref := r.Header.Get("Referer")
			if ref == "" { ref = "./" }
			http.Redirect(w, r, ref, http.StatusSeeOther)
			return
		} else {
			errorText = "INVALID CREDENTIALS"
		}
	}
	
	tmpl, err := template.ParseFiles(filepath.Join("templates", "login.html"))
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	tmpl.Execute(w, map[string]interface{}{"Error": errorText})
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "s5_session", Value: "", Path: "/", MaxAge: -1})
	ref := r.Header.Get("Referer")
	if ref == "" { ref = "./" }
	http.Redirect(w, r, ref, http.StatusSeeOther)
}

func handleRequestReset(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != "POST" {
		http.Error(w, `{"error":"Method not allowed"}`, 405)
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	if body.Email == "" {
		http.Error(w, `{"error":"Email required"}`, 400)
		return
	}

	w.Write([]byte(`{"success":true,"message":"Password reset token generated and sent to email inbox."}`))
}

func handleConfirmReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, `Method not allowed`, 405)
		return
	}

	var resetToken, newPassword string
	var userIDVal interface{}

	contentType := r.Header.Get("Content-Type")
	if strings.Contains(contentType, "application/json") {
		var body struct {
			ResetToken  string      `json:"reset_token"`
			UserID      interface{} `json:"user_id"`
			NewPassword string      `json:"new_password"`
		}
		json.NewDecoder(r.Body).Decode(&body)
		resetToken = body.ResetToken
		userIDVal = body.UserID
		newPassword = body.NewPassword
	} else {
		r.ParseForm()
		resetToken = r.FormValue("reset_token")
		newPassword = r.FormValue("new_password")
		userIDVal = r.FormValue("user_id")
	}

	mu.Lock()
	defer mu.Unlock()

	tok, exists := resetTokens[resetToken]
	if !exists {
		if strings.Contains(contentType, "application/json") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(403)
			w.Write([]byte(`{"error":"Invalid or expired reset token"}`))
		} else {
			http.Redirect(w, r, "/?status=err_invalid_token", http.StatusSeeOther)
		}
		return
	}

	var targetID int
	switch v := userIDVal.(type) {
	case float64:
		targetID = int(v)
	case string:
		targetID, _ = strconv.Atoi(v)
	default:
		targetID = tok.UserID
	}

	u, userExists := users[targetID]
	if !userExists {
		if strings.Contains(contentType, "application/json") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(404)
			w.Write([]byte(`{"error":"User not found"}`))
		} else {
			http.Redirect(w, r, "/?status=err_not_found", http.StatusSeeOther)
		}
		return
	}

	u.Password = newPassword
	
	if strings.Contains(contentType, "application/json") {
		w.Header().Set("Content-Type", "application/json")
		resp := map[string]interface{}{
			"success": true,
			"message": fmt.Sprintf("Password successfully updated for user %d (%s)!", u.UserID, u.FullName),
		}
		json.NewEncoder(w).Encode(resp)
	} else {
		http.Redirect(w, r, "/?status=success&msg="+fmt.Sprintf("Password successfully updated for user %d (%s)!", u.UserID, u.FullName), http.StatusSeeOther)
	}
}

func handleInbox(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	resp := map[string]interface{}{
		"inbox": []map[string]string{
			{
				"from":        "security@secureauth.com",
				"subject":     "Password Reset Request Confirmation Token",
				"reset_token": "reset_tok_user_b_881923",
				"user_id":     "552450897",
			},
		},
	}
	json.NewEncoder(w).Encode(resp)
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	userID, ok := getSessionUser(r)
	if !ok {
		handleLogin(w, r)
		return
	}

	status := r.URL.Query().Get("status")
	msg := r.URL.Query().Get("msg")
	statusText := ""
	if status == "success" {
		statusText = "STATUS: " + msg
	} else if status == "err_invalid_token" {
		statusText = "ERROR: INVALID RESET TOKEN SPECIFIED"
	} else if status == "err_not_found" {
		statusText = "ERROR: TARGET ACCOUNT NOT IDENTIFIED"
	}

	isBob := userID == 552450897
	currentName := "Bob Martinez"
	if !isBob {
		currentName = "Alice Whitfield"
	}

	tmpl, err := template.ParseFiles(filepath.Join("templates", "index.html"))
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	tmpl.Execute(w, map[string]interface{}{
		"CurrentName": currentName,
		"StatusText":  statusText,
		"UserID":      userID,
	})
}

func handleCodeViewer(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles(filepath.Join("templates", "code.html"))
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	tmpl.Execute(w, nil)
}

func handleCodeFile(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	allowedFiles := map[string]bool{
		"main.go":              true,
		"templates/index.html": true,
		"templates/login.html": true,
		"Dockerfile":           true,
	}

	if !allowedFiles[name] {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	content, err := os.ReadFile(name)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write(content)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	http.HandleFunc("/api/v5/request-reset", handleRequestReset)
	http.HandleFunc("/api/v5/confirm-reset", handleConfirmReset)
	http.HandleFunc("/api/v5/inbox", handleInbox)
	http.HandleFunc("/code/file", handleCodeFile)
	
	http.HandleFunc("/code", handleCodeViewer)
	http.HandleFunc("/scenario/5/code", handleCodeViewer)
	http.HandleFunc("/scenario5/code", handleCodeViewer)
	http.HandleFunc("/s5/code", handleCodeViewer)

	http.HandleFunc("/logout", handleLogout)
	http.HandleFunc("/scenario/5/logout", handleLogout)
	http.HandleFunc("/scenario5/logout", handleLogout)
	http.HandleFunc("/s5/logout", handleLogout)

	http.HandleFunc("/", handleIndex)

	fmt.Printf("[Scenario 5 Go App] Listening on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

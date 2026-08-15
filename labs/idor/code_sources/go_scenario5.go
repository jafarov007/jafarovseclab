// Scenario 5: Password Reset Microservice
// Language: Go / Gin Web Framework

package main

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type ResetRequest struct {
	ID       string `json:"id" binding:"required"`
	Password string `json:"password" binding:"required"`
	Confirm  string `json:"confirm" binding:"required"`
}

func main() {
	r := gin.Default()

	db, err := sql.Open("sqlite3", "../data/idor.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// POST /api/v5/passreset
	// VULNERABLE: Handles password reset using `id` parameter directly
	// Missing validation or binding check for the reset token!
	r.POST("/api/v5/passreset", func(c *gin.Context) {
		var req ResetRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload format"})
			return
		}

		if req.Password != req.Confirm {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Passwords do not match"})
			return
		}

		targetID, err := strconv.Atoi(req.ID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		// Vulnerability: Executes UPDATE query directly on targetID without checking reset token token binding!
		stmt, err := db.Prepare("UPDATE users SET password_hash = ? WHERE user_id = ?")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
		defer stmt.Close()

		res, err := stmt.Exec(req.Password, targetID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
			return
		}

		rows, _ := res.RowsAffected()
		if rows == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "User ID not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Password successfully reset for target user",
			"user_id": targetID,
		})
	})

	r.Run(":8085")
}

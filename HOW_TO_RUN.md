# 🚀 How to Run FoodExpress (Spring Boot Version)

A step-by-step guide to build, run, and test the FoodExpress Java Spring Boot backend and static HTML/CSS/JS frontend.

---

## 📦 Step 1 — Prerequisites

Make sure you have the following installed on your machine:
1. **Java JDK 17** or higher (e.g., OpenJDK 17)
2. **VS Code** (or IntelliJ IDEA)
3. **Maven** (optional, as the project includes the Maven Wrapper `./mvnw`)

---

## 📂 Step 2 — Open the Project in VS Code

1. Open **VS Code**
2. Go to **File → Open Folder**
3. Select this `FoodExpress` project root folder.

---

## 💻 Step 3 — Run the Spring Boot Server

In the integrated terminal of VS Code (`` Ctrl + ` ``):

- **Linux / macOS**:
  ```bash
  ./mvnw spring-boot:run
  ```
- **Windows**:
  ```cmd
  mvnw.cmd spring-boot:run
  ```

Upon startup, you will see output indicating that:
- The server initialized Tomcat on port **8082**.
- An in-memory H2 database was initialized.
- Default foods and the developer admin account were automatically seeded.

---

## 🌐 Step 4 — Open in Browser

1. Open your browser and navigate to: **`http://localhost:8082`**
2. You should see the home page load beautifully.

---

## 👤 Step 5 — Log In with Developer Admin Account

We have pre-configured a developer account that gives you access to admin-only views:

| Field    | Value             |
|----------|-------------------|
| Email    | `dev@example.com` |
| Password | `dev`             |
| Role     | `ADMIN`           |

1. Click **Sign In** in the navigation header (which opens the popup modal).
2. Enter the email `dev@example.com` and password `dev`.
3. Hit **Login**.
4. Once logged in, you will see the **Admin Panel** link appear in the header navigation!

---

## 🛠️ Step 6 — Database Console (H2)

The application uses an in-memory H2 database. You can view the database tables using the console:
- **URL**: `http://localhost:8082/h2-console`
- **JDBC URL**: `jdbc:h2:mem:foodexpress`
- **Username**: `SA`
- **Password**: *(Leave empty)*

Click **Connect** to query `users`, `foods`, and `orders` tables directly.

---

## 📁 Key Folders & Files

| Path | Purpose |
|------|---------|
| `src/main/java/com/foodexpress/` | Java backend controllers, models, security, and repositories. |
| `src/main/resources/static/` | Frontend assets (`index.html`, `menu.html`, `style.css`, `script.js`, `images/`). |
| `target/classes/static/` | Folder served by Tomcat. Copy static modifications here to test live without restart. |

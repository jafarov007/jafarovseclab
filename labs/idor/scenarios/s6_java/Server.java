import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class Server {
    private static final Map<Long, String> roles = new HashMap<>();
    private static final Map<String, Map<String, String>> users = new HashMap<>();
    private static final Map<Long, Map<String, String>> usersById = new HashMap<>();

    static {
        roles.put(995043202L, "super_admin");
        roles.put(552450897L, "user");

        Map<String, String> userA = new HashMap<>();
        userA.put("email", "user.a@example.com");
        userA.put("password", "password123");
        userA.put("user_id", "995043202");
        userA.put("name", "Alice Whitfield");
        userA.put("token", "session_a");
        userA.put("dept", "Executive Office");
        users.put("user.a@example.com", userA);
        usersById.put(995043202L, userA);

        Map<String, String> userB = new HashMap<>();
        userB.put("email", "user.b@example.com");
        userB.put("password", "password123");
        userB.put("user_id", "552450897");
        userB.put("name", "Bob Martinez");
        userB.put("token", "session_b");
        userB.put("dept", "Internal Logistics");
        users.put("user.b@example.com", userB);
        usersById.put(552450897L, userB);
    }

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8086"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/v6/login", new LoginHandler());
        server.createContext("/scenario/6/login", new LoginHandler());
        server.createContext("/scenario6/login", new LoginHandler());
        server.createContext("/s6/login", new LoginHandler());
        server.createContext("/login", new LoginHandler());

        server.createContext("/api/v6/user/profile", new ProfileApiHandler());
        server.createContext("/api/v6/admin/promote", new PromoteHandler());
        server.createContext("/scenario/6/api/v6/admin/promote", new PromoteHandler());
        server.createContext("/scenario6/api/v6/admin/promote", new PromoteHandler());
        server.createContext("/s6/api/v6/admin/promote", new PromoteHandler());

        server.createContext("/code/file", new CodeFileHandler());
        server.createContext("/code", new CodeViewerHandler());
        server.createContext("/scenario/6/code", new CodeViewerHandler());
        server.createContext("/scenario6/code", new CodeViewerHandler());
        server.createContext("/s6/code", new CodeViewerHandler());

        server.createContext("/logout", new LogoutHandler());
        server.createContext("/scenario/6/logout", new LogoutHandler());
        server.createContext("/scenario6/logout", new LogoutHandler());
        server.createContext("/s6/logout", new LogoutHandler());

        server.createContext("/scenario/6", new IndexHandler());
        server.createContext("/scenario6", new IndexHandler());
        server.createContext("/s6", new IndexHandler());
        server.createContext("/", new IndexHandler());

        server.setExecutor(null);
        System.out.println("[Scenario 6 Java App] Listening on port " + port);
        server.start();
    }

    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String bodyStr = readBody(exchange);
                Map<String, String> form = parseForm(bodyStr);
                String email = form.get("email");
                String password = form.get("password");

                Map<String, String> u = users.get(email);
                if (u != null && u.get("password").equals(password)) {
                    exchange.getResponseHeaders().set("Set-Cookie", "s6_session=" + u.get("token") + "; Path=/; HttpOnly");
                    String ref = exchange.getRequestHeaders().getFirst("Referer");
                    if (ref == null) ref = "./";
                    exchange.getResponseHeaders().set("Location", ref);
                    exchange.sendResponseHeaders(303, -1);
                    return;
                }
            }

            String html = readFile("html/login.html");
            sendHtml(exchange, html, 200);
        }
    }

    static class LogoutHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Set-Cookie", "s6_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
            String ref = exchange.getRequestHeaders().getFirst("Referer");
            if (ref == null) ref = "./";
            exchange.getResponseHeaders().set("Location", ref);
            exchange.sendResponseHeaders(303, -1);
        }
    }

    static class ProfileApiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            long reqUserId = 552450897L;
            if (query != null && query.contains("user_id=")) {
                try {
                    reqUserId = Long.parseLong(query.split("user_id=")[1].split("&")[0]);
                } catch (Exception e) {}
            }

            Map<String, String> u = usersById.get(reqUserId);
            if (u == null) u = usersById.get(995043202L);

            String userRole = roles.getOrDefault(reqUserId, "user");
            String json = "{\"status\":\"success\",\"data\":{\"user_id\":" + reqUserId + 
                          ",\"email\":\"" + u.get("email") + 
                          "\",\"full_name\":\"" + u.get("name") + 
                          "\",\"role\":\"" + userRole + 
                          "\",\"department\":\"" + u.get("dept") + "\"}}";

            exchange.getResponseHeaders().set("Content-Type", "application/json");
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }

    static class PromoteHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readBody(exchange);
                long targetId = 552450897L;
                String action = "promote";

                if (body.contains("target_user_id")) {
                    try {
                        if (body.contains("{")) {
                            String[] parts = body.split("target_user_id\":");
                            if (parts.length > 1) {
                                String numStr = parts[1].split(",")[0].split("}")[0].trim();
                                targetId = Long.parseLong(numStr);
                            }
                        } else {
                            Map<String, String> form = parseForm(body);
                            if (form.containsKey("target_user_id")) {
                                targetId = Long.parseLong(form.get("target_user_id"));
                            }
                            if (form.containsKey("action")) {
                                action = form.get("action");
                            }
                        }
                    } catch (Exception e) {}
                }

                if ("demote".equalsIgnoreCase(action)) {
                    roles.put(targetId, "user");
                } else {
                    roles.put(targetId, "admin");
                }

                if (body.contains("{")) {
                    String json = "{\"success\":true, \"message\":\"User " + targetId + " updated role to " + roles.get(targetId) + "\"}";
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(200, bytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(bytes);
                    os.close();
                } else {
                    String ref = exchange.getRequestHeaders().getFirst("Referer");
                    if (ref == null || ref.isEmpty()) {
                        ref = "/scenario/6/";
                    } else {
                        if (ref.contains("?")) {
                            ref = ref.substring(0, ref.indexOf("?"));
                        }
                    }
                    if (!ref.endsWith("/")) {
                        ref += "/";
                    }
                    exchange.getResponseHeaders().set("Location", ref + "?status=" + action + "&target=" + targetId);
                    exchange.sendResponseHeaders(303, -1);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    static class IndexHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String session = getCookieValue(exchange, "s6_session");
            if (session == null) {
                new LoginHandler().handle(exchange);
                return;
            }

            boolean isBobSession = "session_b".equals(session);
            long sessionUserId = isBobSession ? 552450897L : 995043202L;
            
            String currentRole = roles.getOrDefault(sessionUserId, "user");
            boolean isSuperAdmin = "super_admin".equalsIgnoreCase(currentRole);
            boolean isAdmin = "admin".equalsIgnoreCase(currentRole) || isSuperAdmin;

            String currentName = isBobSession ? "Bob Martinez" : "Alice Whitfield";
            String roleDisplay = isSuperAdmin ? "Super Admin" : (isAdmin ? "Administrator" : "Standard Operator");

            String query = exchange.getRequestURI().getQuery();
            String statusMsg = "";
            if (query != null) {
                if (query.contains("status=promoted") || query.contains("status=promote")) {
                    String target = "552450897";
                    if (query.contains("target=")) {
                        target = query.split("target=")[1].split("&")[0];
                    }
                    statusMsg = "<div class='status-msg'>✅ Privilege Change Applied for User ID: " + target + "</div>";
                } else if (query.contains("status=demote")) {
                    String target = "552450897";
                    if (query.contains("target=")) {
                        target = query.split("target=")[1].split("&")[0];
                    }
                    statusMsg = "<div class='status-msg'>ℹ️ Demoted User ID: " + target + " to Standard User</div>";
                }
            }

            StringBuilder mainContent = new StringBuilder();
            if (isAdmin) {
                // Admin / Super Admin Directory View
                mainContent.append("<div class='card'>");
                mainContent.append("<div class='card-header'><h3 class='card-title'>Corporate Directory & Privilege Control Panel</h3></div>");
                mainContent.append("<p style='color:#94a3b8; font-size:0.9rem;'>Executive Access Rights & Management Console</p>");
                mainContent.append("<table class='table'><thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Assigned Role</th><th>Actions</th></tr></thead><tbody>");
                
                // Bob Row
                String bobRoleStr = "admin".equals(roles.get(552450897L)) ? "<span style='color:var(--accent); font-weight:700;'>Administrator</span>" : "<span style='color:#f87171;'>Standard User</span>";
                String bobBtn = "";
                if (isSuperAdmin) {
                    if ("admin".equals(roles.get(552450897L))) {
                        bobBtn = "<form id='role-form-552450897' method='POST' action='' style='display:inline;'><script>document.getElementById('role-form-552450897').action = window.location.pathname.replace(/\\/$/, '') + '/api/v6/admin/promote';</script><input type='hidden' name='target_user_id' value='552450897'><input type='hidden' name='action' value='demote'><button type='submit' class='btn' style='background:#f87171; color:#fff;'>Demote Role</button></form>";
                    } else {
                        bobBtn = "<form id='role-form-552450897' method='POST' action='' style='display:inline;'><script>document.getElementById('role-form-552450897').action = window.location.pathname.replace(/\\/$/, '') + '/api/v6/admin/promote';</script><input type='hidden' name='target_user_id' value='552450897'><input type='hidden' name='action' value='promote'><button type='submit' class='btn'>Promote to Admin</button></form>";
                    }
                } else {
                    bobBtn = "<button class='btn' disabled style='opacity:0.4;'>No Action</button>";
                }

                mainContent.append("<tr><td><code>552450897</code></td><td>Bob Martinez</td><td>user.b@example.com</td><td>").append(bobRoleStr).append("</td><td>").append(bobBtn).append("</td></tr>");
                
                // Alice Row (Super Admin)
                mainContent.append("<tr><td><code>995043202</code></td><td>Alice Whitfield</td><td>user.a@example.com</td><td><span style='color:#a855f7; font-weight:800;'>Super Admin</span></td><td><button class='btn' disabled style='opacity:0.4;'>System Owner</button></td></tr>");
                
                mainContent.append("</tbody></table></div>");
            } else {
                // Normal User Profile View
                mainContent.append("<div class='card'>");
                mainContent.append("<div class='card-header'><h3 class='card-title'>User Profile & Workspace</h3></div>");
                mainContent.append("<p style='color:#94a3b8; font-size:0.9rem;'>Personal User Profile and Account Management Dashboard</p>");
                mainContent.append("<div class='info-grid'>");
                mainContent.append("<div class='info-item'><div class='info-label'>User ID</div><div class='info-val'><code>552450897</code></div></div>");
                mainContent.append("<div class='info-item'><div class='info-label'>Full Name</div><div class='info-val'>Bob Martinez</div></div>");
                mainContent.append("<div class='info-item'><div class='info-label'>Email Address</div><div class='info-val'>user.b@example.com</div></div>");
                mainContent.append("<div class='info-item'><div class='info-label'>Assigned Role</div><div class='info-val' style='color:#f87171;'>Standard Operator</div></div>");
                mainContent.append("<div class='info-item'><div class='info-label'>Department</div><div class='info-val'>Internal Logistics</div></div>");
                mainContent.append("<div class='info-item'><div class='info-label'>Access Clearance</div><div class='info-val'>Tier 1 (Standard)</div></div>");
                mainContent.append("</div>");
                mainContent.append("<div style='margin-top:24px; padding:14px; background:rgba(51,65,85,0.4); border-radius:8px; border:1px dashed #475569; color:#94a3b8; font-size:0.85rem;'>ℹ️ You are currently operating under standard user privileges. Role changes must be processed by Super Admin (Alice Whitfield).</div>");
                mainContent.append("</div>");
            }

            String html = readFile("html/index.html");
            html = html.replace("{{CURRENT_NAME}}", currentName)
                       .replace("{{ROLE_NAME}}", roleDisplay)
                       .replace("{{STATUS_MSG}}", statusMsg)
                       .replace("{{MAIN_CONTENT}}", mainContent.toString());

            sendHtml(exchange, html, 200);
        }
    }

    static class CodeViewerHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String html = readFile("html/code.html");
            sendHtml(exchange, html, 200);
        }
    }

    static class CodeFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String name = "";
            if (query != null && query.contains("name=")) {
                name = URLDecoder.decode(query.split("name=")[1].split("&")[0], StandardCharsets.UTF_8);
            }

            if (!name.equals("Server.java") && !name.equals("html/index.html") && !name.equals("html/login.html") && !name.equals("Dockerfile")) {
                exchange.sendResponseHeaders(403, -1);
                return;
            }

            File f = new File(name);
            if (f.exists()) {
                byte[] content = Files.readAllBytes(f.toPath());
                exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
                exchange.sendResponseHeaders(200, content.length);
                OutputStream os = exchange.getResponseBody();
                os.write(content);
                os.close();
            } else {
                exchange.sendResponseHeaders(404, -1);
            }
        }
    }

    private static String readFile(String relativePath) throws IOException {
        return Files.readString(Path.of(relativePath), StandardCharsets.UTF_8);
    }

    private static void sendHtml(HttpExchange exchange, String html, int status) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
        byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return sb.toString();
    }

    private static Map<String, String> parseForm(String body) {
        Map<String, String> map = new HashMap<>();
        String[] pairs = body.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length == 2) {
                try {
                    map.put(URLDecoder.decode(kv[0], "UTF-8"), URLDecoder.decode(kv[1], "UTF-8"));
                } catch (Exception e) {}
            }
        }
        return map;
    }

    private static String getCookieValue(HttpExchange exchange, String cookieName) {
        String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
        if (cookieHeader == null) return null;
        String[] cookies = cookieHeader.split(";");
        for (String cookie : cookies) {
            String[] kv = cookie.trim().split("=");
            if (kv.length == 2 && kv[0].equals(cookieName)) {
                return kv[1];
            }
        }
        return null;
    }
}

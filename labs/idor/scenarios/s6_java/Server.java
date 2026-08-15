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

    static {
        roles.put(995043202L, "admin");
        roles.put(552450897L, "user");

        Map<String, String> userA = new HashMap<>();
        userA.put("email", "user.a@example.com");
        userA.put("password", "password123");
        userA.put("user_id", "995043202");
        userA.put("name", "Alice Whitfield");
        userA.put("token", "session_a");
        users.put("user.a@example.com", userA);

        Map<String, String> userB = new HashMap<>();
        userB.put("email", "user.b@example.com");
        userB.put("password", "password123");
        userB.put("user_id", "552450897");
        userB.put("name", "Bob Martinez");
        userB.put("token", "session_b");
        users.put("user.b@example.com", userB);
    }

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8086"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/v6/login", new LoginHandler());
        server.createContext("/scenario/6/login", new LoginHandler());
        server.createContext("/scenario6/login", new LoginHandler());
        server.createContext("/s6/login", new LoginHandler());
        server.createContext("/login", new LoginHandler());

        server.createContext("/api/v6/admin/promote", new PromoteHandler());
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

    static class PromoteHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readBody(exchange);
                long targetId = 552450897L;

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
                            targetId = Long.parseLong(form.get("target_user_id"));
                        }
                    } catch (Exception e) {}
                }

                roles.put(targetId, "admin");

                if (body.contains("{")) {
                    String json = "{\"success\":true, \"message\":\"User " + targetId + " successfully promoted to ADMIN role!\"}";
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, json.length());
                    OutputStream os = exchange.getResponseBody();
                    os.write(json.getBytes(StandardCharsets.UTF_8));
                    os.close();
                } else {
                    exchange.getResponseHeaders().set("Location", "./?status=promoted&target=" + targetId);
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

            boolean isBob = "session_b".equals(session);
            String currentName = isBob ? "Bob Martinez" : "Alice Whitfield";
            String roleName = isBob ? "Standard Operator" : "Administrator";

            String query = exchange.getRequestURI().getQuery();
            String statusMsg = "";
            if (query != null && query.contains("status=promoted")) {
                String target = "552450897";
                if (query.contains("target=")) {
                    target = query.split("target=")[1].split("&")[0];
                }
                statusMsg = "<div class='status-msg'>✅ System Privilege Escalation Successful for Target ID: " + target + "</div>";
            }

            String html = readFile("html/index.html");
            html = html.replace("{{CURRENT_NAME}}", currentName)
                       .replace("{{ROLE_NAME}}", roleName)
                       .replace("{{STATUS_MSG}}", statusMsg);

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

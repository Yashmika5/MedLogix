#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
using socket_t = SOCKET;
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <arpa/inet.h>
using socket_t = int;
#define INVALID_SOCKET (-1)
#define SOCKET_ERROR   (-1)
#endif

#include "MedicineReminderSystem.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <cstring>
#include <thread>
#include <algorithm>
void closeSocket(socket_t sock);

// Global instance of the Medicine Reminder System
MedicineReminderSystem medicineSystem;

// URL decode function
std::string urlDecode(const std::string& str) {
    std::string result;
    for (size_t i = 0; i < str.length(); i++) {
        if (str[i] == '+') {
            result += ' ';
        } else if (str[i] == '%' && i + 2 < str.length()) {
            int value;
            std::istringstream is(str.substr(i + 1, 2));
            if (is >> std::hex >> value) {
                result += static_cast<char>(value);
                i += 2;
            }
        } else {
            result += str[i];
        }
    }
    return result;
}

// Parse POST data
std::string getPostValue(const std::string& postData, const std::string& key) {
    std::string searchKey = key + "=";
    size_t pos = postData.find(searchKey);
    if (pos != std::string::npos) {
        size_t start = pos + searchKey.length();
        size_t end = postData.find("&", start);
        if (end == std::string::npos) {
            end = postData.length();
        }
        return urlDecode(postData.substr(start, end - start));
    }
    return "";
}

// Safely parse integer from string with validation
bool safeParseInt(const std::string& str, int& result, int minValue = 0) {
    if (str.empty()) {
        return false;
    }
    
    size_t startPos = 0;
    if (str[0] == '-') {
        startPos = 1;
        if (str.length() == 1) return false;
    }
    
    for (size_t i = startPos; i < str.length(); i++) {
        if (!std::isdigit(str[i])) {
            return false;
        }
    }
    
    try {
        result = std::stoi(str);
        if (result < minValue) {
            return false;
        }
        return true;
    } catch (const std::exception&) {
        return false;
    }
}

std::string handleAPI(const std::string& path, const std::string& postData) {
    std::stringstream response;
    
    if (path == "/api/status") {
        response << medicineSystem.getSystemStatus();
    }
    else if (path == "/api/categories") {
        response << medicineSystem.listCategories();
    }
    else if (path == "/api/add_category") {
        std::string category = getPostValue(postData, "category");
        if (medicineSystem.addCategory(category)) {
            response << "SUCCESS: Category added: " << category;
        } else {
            response << "ERROR: Could not add category (may already exist or array full)";
        }
    }
    else if (path == "/api/remove_category") {
        std::string category = getPostValue(postData, "category");
        if (medicineSystem.removeCategory(category)) {
            response << "SUCCESS: Category removed: " << category;
        } else {
            response << "ERROR: Category not found";
        }
    }
    else if (path == "/api/medicines") {
        response << medicineSystem.listAllMedicines();
    }
    else if (path == "/api/medicines_by_category") {
        std::string category = getPostValue(postData, "category");
        response << medicineSystem.listMedicinesByCategory(category);
    }
    else if (path == "/api/add_medicine") {
        std::string name = getPostValue(postData, "name");
        std::string dose = getPostValue(postData, "dose");
        std::string timings = getPostValue(postData, "timings");
        std::string category = getPostValue(postData, "category");
        medicineSystem.addMedicine(name, dose, timings, category);
        response << "SUCCESS: Medicine added: " << name;
    }
    else if (path == "/api/delete_medicine") {
        std::string name = getPostValue(postData, "name");
        if (medicineSystem.deleteMedicine(name)) {
            response << "SUCCESS: Medicine deleted: " << name;
        } else {
            response << "ERROR: Medicine not found";
        }
    }
    else if (path == "/api/search_medicine") {
        std::string name = getPostValue(postData, "name");
        response << medicineSystem.searchMedicine(name);
    }
    else if (path == "/api/schedule_reminder") {
        std::string medicine = getPostValue(postData, "medicine");
        std::string time = getPostValue(postData, "time");
        medicineSystem.scheduleReminder(medicine, time);
        response << "SUCCESS: Reminder scheduled for " << medicine << " at " << time;
    }
    else if (path == "/api/reminders") {
        response << medicineSystem.viewScheduledReminders();
    }
    else if (path == "/api/next_reminder") {
        response << "Next Reminder: " << medicineSystem.getNextReminder();
    }
    else if (path == "/api/reminder_queue") {
        response << medicineSystem.viewReminderQueue();
    }
    else if (path == "/api/mark_taken") {
        medicineSystem.markReminderTaken();
        response << "SUCCESS: Reminder marked as taken";
    }
    else if (path == "/api/delete_reminder") {
        std::string medicine = getPostValue(postData, "medicine");
        std::string time = getPostValue(postData, "time");
        if (medicineSystem.deleteReminder(medicine, time)) {
            response << "SUCCESS: Reminder deleted";
        } else {
            response << "ERROR: Reminder not found";
        }
    }
    else if (path == "/api/undo") {
        if (medicineSystem.undo()) {
        response << "SUCCESS: Last action undone";

        }else {
            response << "ERROR: No actions to undo";
        }
    }
    else if (path == "/api/history") {
        response << medicineSystem.viewActionHistory();
    }
    else if (path == "/api/add_medicine_with_stock") {
        std::string name = getPostValue(postData, "name");
        std::string dose = getPostValue(postData, "dose");
        std::string timings = getPostValue(postData, "timings");
        std::string category = getPostValue(postData, "category");
        int stock, threshold;
        
        if (!safeParseInt(getPostValue(postData, "stock"), stock, 0)) {
            response << "ERROR: Invalid stock quantity (must be a non-negative number)";
        } else if (!safeParseInt(getPostValue(postData, "threshold"), threshold, 1)) {
            response << "ERROR: Invalid threshold (must be a positive number)";
        } else {
            medicineSystem.addMedicineWithStock(name, dose, timings, category, stock, threshold);
            response << "SUCCESS: Medicine added with stock: " << name << " (Stock: " << stock << ")";
        }
    }
    else if (path == "/api/update_stock") {
        std::string name = getPostValue(postData, "name");
        int quantity;
        
        if (!safeParseInt(getPostValue(postData, "quantity"), quantity, 0)) {
            response << "ERROR: Invalid quantity (must be a non-negative number)";
        } else if (medicineSystem.updateStock(name, quantity)) {
            response << "SUCCESS: Stock updated for " << name << " to " << quantity;
        } else {
            response << "ERROR: Medicine not found";
        }
    }
    else if (path == "/api/decrease_stock") {
        std::string name = getPostValue(postData, "name");
        int quantity;
        
        if (!safeParseInt(getPostValue(postData, "quantity"), quantity, 1)) {
            response << "ERROR: Invalid quantity (must be a positive number)";
        } else if (medicineSystem.decreaseStock(name, quantity)) {
            response << "SUCCESS: Stock decreased for " << name << " by " << quantity;
        } else {
            response << "ERROR: Medicine not found or insufficient stock";
        }
    }
    else if (path == "/api/stock_levels") {
        response << medicineSystem.viewStockLevels();
    }
    else if (path == "/api/low_stock_alerts") {
        response << medicineSystem.getLowStockAlerts();
    }
    else if (path == "/api/check_stock") {
        std::string name = getPostValue(postData, "name");
        if (medicineSystem.checkStockAvailable(name)) {
            response << "Stock Available";
        } else {
            response << "Out of Stock";
        }
    }
    else {
        response << "ERROR: Unknown API endpoint";
    }
    
    return response.str();
}

// Read file content
std::string readFile(const std::string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) return "<h1>File not found</h1>";
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

// Handle HTTP request
void handleRequest(socket_t clientSocket) {
    char buffer[4096] = {0};
#ifdef _WIN32
    int bytesRead = recv(clientSocket, buffer, sizeof(buffer), 0);
#else
    ssize_t bytesRead = read(clientSocket, buffer, sizeof(buffer));
#endif
    if (bytesRead <= 0) {
        closeSocket(clientSocket);
        return;
    }
    
    std::string request(buffer, bytesRead);
    std::istringstream iss(request);
    std::string method, path, version;
    iss >> method >> path >> version;
    
    std::string response;
    std::string contentType = "text/html";
    std::string body;
    
    // Extract POST data if present
    std::string postData;
    size_t bodyPos = request.find("\r\n\r\n");
    if (bodyPos != std::string::npos) {
        postData = request.substr(bodyPos + 4);
    }
    
    if (path == "/" || path == "/index.html") {
        body = readFile("public/index.html");
    }
    else if (path == "/style.css") {
        body = readFile("public/style.css");
        contentType = "text/css";
    }
    else if (path == "/script.js") {
        body = readFile("public/script.js");
        contentType = "application/javascript";
    }
    else if (path.find("/api/") == 0) {
        body = handleAPI(path, postData);
        contentType = "text/plain";
    }
    
    else {
        body = "<h1>404 Not Found</h1>";
    }
    
    response = "HTTP/1.1 200 OK\r\n";
    response += "Content-Type: " + contentType + "\r\n";
    response += "Content-Length: " + std::to_string(body.length()) + "\r\n";
    response += "Cache-Control: no-cache\r\n";
    response += "\r\n";
    response += body;
    
#ifdef _WIN32
    send(clientSocket, response.c_str(), static_cast<int>(response.length()), 0);
#else
    send(clientSocket, response.c_str(), response.length(), 0);
#endif
    
    closeSocket(clientSocket);
}

void closeSocket(socket_t sock) {
#ifdef _WIN32
    closesocket(sock);
#else
    close(sock);
#endif
}

bool startupSockets() {
#ifdef _WIN32
    WSADATA wsaData;
    return WSAStartup(MAKEWORD(2, 2), &wsaData) == 0;
#else
    return true; // No init needed on UNIX
#endif
}

void cleanupSockets() {
#ifdef _WIN32
    WSACleanup();
#endif
}

int main() {
    if (!startupSockets()) {
        std::cerr << "Socket startup failed\n";
        return 1;
    }
    
    socket_t serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "Failed to create socket\n";
        cleanupSockets();
        return 1;
    }
    
    int opt = 1;
#ifdef _WIN32
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
#else
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt));
#endif
    
    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(5000);
    
    if (bind(serverSocket, (sockaddr*)&address, sizeof(address)) == SOCKET_ERROR) {
        std::cerr << "Bind failed\n";
        closeSocket(serverSocket);
        cleanupSockets();
        return 1;
    }
    
    if (listen(serverSocket, 10) == SOCKET_ERROR) {
        std::cerr << "Listen failed\n";
        closeSocket(serverSocket);
        cleanupSockets();
        return 1;
    }
    
    std::cout << "=== Medicine Reminder System Server ===\n";
    std::cout << "Server running on http://0.0.0.0:5000\n";
    std::cout << "Data structures implemented:\n";
    std::cout << "  • Array (Category Manager)\n";
    std::cout << "  • Linked List (Medicine Manager)\n";
    std::cout << "  • Binary Search Tree (Reminder Scheduler)\n";
    std::cout << "  • Queue (Reminder Queue)\n";
    std::cout << "  • Stack (Undo Manager)\n\n";
    
    while (true) {
        socket_t clientSocket = accept(serverSocket, nullptr, nullptr);
        if (clientSocket != INVALID_SOCKET) {
            std::thread(handleRequest, clientSocket).detach();
        }
    }
    
    closeSocket(serverSocket);
    cleanupSockets();
    return 0;
}

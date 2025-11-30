#include "MedicineReminderSystem.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <thread>
#include <algorithm>

// Global instance of the Medicine Reminder System
MedicineReminderSystem system;

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

// Handle API requests
std::string handleAPI(const std::string& path, const std::string& postData) {
    std::stringstream response;
    
    if (path == "/api/status") {
        response << system.getSystemStatus();
    }
    else if (path == "/api/categories") {
        response << system.listCategories();
    }
    else if (path == "/api/add_category") {
        std::string category = getPostValue(postData, "category");
        if (system.addCategory(category)) {
            response << "SUCCESS: Category added: " << category;
        } else {
            response << "ERROR: Could not add category (may already exist or array full)";
        }
    }
    else if (path == "/api/remove_category") {
        std::string category = getPostValue(postData, "category");
        if (system.removeCategory(category)) {
            response << "SUCCESS: Category removed: " << category;
        } else {
            response << "ERROR: Category not found";
        }
    }
    else if (path == "/api/medicines") {
        response << system.listAllMedicines();
    }
    else if (path == "/api/medicines_by_category") {
        std::string category = getPostValue(postData, "category");
        response << system.listMedicinesByCategory(category);
    }
    else if (path == "/api/add_medicine") {
        std::string name = getPostValue(postData, "name");
        std::string dose = getPostValue(postData, "dose");
        std::string timings = getPostValue(postData, "timings");
        std::string category = getPostValue(postData, "category");
        system.addMedicine(name, dose, timings, category);
        response << "SUCCESS: Medicine added: " << name;
    }
    else if (path == "/api/delete_medicine") {
        std::string name = getPostValue(postData, "name");
        if (system.deleteMedicine(name)) {
            response << "SUCCESS: Medicine deleted: " << name;
        } else {
            response << "ERROR: Medicine not found";
        }
    }
    else if (path == "/api/search_medicine") {
        std::string name = getPostValue(postData, "name");
        response << system.searchMedicine(name);
    }
    else if (path == "/api/schedule_reminder") {
        std::string medicine = getPostValue(postData, "medicine");
        std::string time = getPostValue(postData, "time");
        system.scheduleReminder(medicine, time);
        response << "SUCCESS: Reminder scheduled for " << medicine << " at " << time;
    }
    else if (path == "/api/reminders") {
        response << system.viewScheduledReminders();
    }
    else if (path == "/api/next_reminder") {
        response << "Next Reminder: " << system.getNextReminder();
    }
    else if (path == "/api/reminder_queue") {
        response << system.viewReminderQueue();
    }
    else if (path == "/api/mark_taken") {
        system.markReminderTaken();
        response << "SUCCESS: Reminder marked as taken";
    }
    else if (path == "/api/delete_reminder") {
        std::string medicine = getPostValue(postData, "medicine");
        std::string time = getPostValue(postData, "time");
        if (system.deleteReminder(medicine, time)) {
            response << "SUCCESS: Reminder deleted";
        } else {
            response << "ERROR: Reminder not found";
        }
    }
    else if (path == "/api/undo") {
        if (system.undoLastAction()) {
            response << "SUCCESS: Last action undone";
        } else {
            response << "ERROR: No actions to undo";
        }
    }
    else if (path == "/api/history") {
        response << system.viewActionHistory();
    }
    else {
        response << "ERROR: Unknown API endpoint";
    }
    
    return response.str();
}

// Read file content
std::string readFile(const std::string& filename) {
    std::ifstream file(filename);
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

// Handle HTTP request
void handleRequest(int clientSocket) {
    char buffer[4096] = {0};
    read(clientSocket, buffer, 4096);
    
    std::string request(buffer);
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
    
    send(clientSocket, response.c_str(), response.length(), 0);
    close(clientSocket);
}

int main() {
    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket == -1) {
        std::cerr << "Failed to create socket\n";
        return 1;
    }
    
    int opt = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt));
    
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(5000);
    
    if (bind(serverSocket, (struct sockaddr*)&address, sizeof(address)) < 0) {
        std::cerr << "Bind failed\n";
        return 1;
    }
    
    if (listen(serverSocket, 10) < 0) {
        std::cerr << "Listen failed\n";
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
        int clientSocket = accept(serverSocket, nullptr, nullptr);
        if (clientSocket >= 0) {
            std::thread(handleRequest, clientSocket).detach();
        }
    }
    
    close(serverSocket);
    return 0;
}

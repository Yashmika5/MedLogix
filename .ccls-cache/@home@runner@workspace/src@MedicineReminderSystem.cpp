#include "MedicineReminderSystem.h"
#include <sstream>
#include <iostream>
#include <ctime>

// ============================================================================
// CATEGORY MANAGER IMPLEMENTATION
// ============================================================================

CategoryManager::CategoryManager() : categoryCount(0) {
    // Initialize with default medical categories
    categories[categoryCount++] = "Antibiotics";
    categories[categoryCount++] = "Painkillers";
    categories[categoryCount++] = "Vitamins";
    categories[categoryCount++] = "Antacids";
    categories[categoryCount++] = "Antihistamines";
}

bool CategoryManager::addCategory(const std::string& category) {
    // Check if array is full
    if (categoryCount >= MAX_CATEGORIES) {
        return false;
    }
    
    // Check if category already exists
    if (exists(category)) {
        return false;
    }
    
    // Add category at the end (O(1) insertion)
    categories[categoryCount++] = category;
    return true;
}

bool CategoryManager::removeCategory(const std::string& category) {
    // Linear search for the category O(n)
    for (int i = 0; i < categoryCount; i++) {
        if (categories[i] == category) {
            // Shift all elements after this position left O(n)
            for (int j = i; j < categoryCount - 1; j++) {
                categories[j] = categories[j + 1];
            }
            categoryCount--;
            return true;
        }
    }
    return false;
}

std::string CategoryManager::getCategory(int index) const {
    if (index >= 0 && index < categoryCount) {
        return categories[index];
    }
    return "";
}

bool CategoryManager::exists(const std::string& category) const {
    // Linear search through array O(n)
    for (int i = 0; i < categoryCount; i++) {
        if (categories[i] == category) {
            return true;
        }
    }
    return false;
}

std::string CategoryManager::getAllCategories() const {
    std::stringstream ss;
    ss << "Categories (" << categoryCount << "):\n";
    for (int i = 0; i < categoryCount; i++) {
        ss << (i + 1) << ". " << categories[i] << "\n";
    }
    return ss.str();
}

// ============================================================================
// MEDICINE MANAGER IMPLEMENTATION
// ============================================================================

MedicineManager::MedicineManager() : head(nullptr), medicineCount(0) {}

MedicineManager::~MedicineManager() {
    // Traverse and delete all nodes to prevent memory leaks
    Medicine* current = head;
    while (current != nullptr) {
        Medicine* temp = current;
        current = current->next;
        delete temp;
    }
}

void MedicineManager::addMedicine(const std::string& name, const std::string& dose, 
                                  const std::string& timings, const std::string& category) {
    // Create new medicine node
    Medicine* newMedicine = new Medicine(name, dose, timings, category);
    
    // Insert at head for O(1) insertion
    newMedicine->next = head;
    head = newMedicine;
    medicineCount++;
}

bool MedicineManager::deleteMedicine(const std::string& name) {
    // Empty list check
    if (head == nullptr) {
        return false;
    }
    
    // Check if head node matches
    if (head->name == name) {
        Medicine* temp = head;
        head = head->next;
        delete temp;
        medicineCount--;
        return true;
    }
    
    // Traverse to find the medicine
    Medicine* current = head;
    while (current->next != nullptr) {
        if (current->next->name == name) {
            Medicine* temp = current->next;
            current->next = current->next->next;
            delete temp;
            medicineCount--;
            return true;
        }
        current = current->next;
    }
    
    return false;
}

Medicine* MedicineManager::searchMedicine(const std::string& name) {
    // Linear search through linked list O(n)
    Medicine* current = head;
    while (current != nullptr) {
        if (current->name == name) {
            return current;
        }
        current = current->next;
    }
    return nullptr;
}

std::string MedicineManager::getAllMedicines() const {
    std::stringstream ss;
    ss << "All Medicines (" << medicineCount << "):\n";
    
    Medicine* current = head;
    int count = 1;
    while (current != nullptr) {
        ss << count++ << ". " << current->name 
           << " | Dose: " << current->dose 
           << " | Timings: " << current->timings 
           << " | Category: " << current->category << "\n";
        current = current->next;
    }
    
    if (medicineCount == 0) {
        ss << "No medicines added yet.\n";
    }
    
    return ss.str();
}

std::string MedicineManager::getMedicinesByCategory(const std::string& category) const {
    std::stringstream ss;
    ss << "Medicines in " << category << ":\n";
    
    Medicine* current = head;
    int count = 1;
    bool found = false;
    
    while (current != nullptr) {
        if (current->category == category) {
            ss << count++ << ". " << current->name 
               << " | Dose: " << current->dose 
               << " | Timings: " << current->timings << "\n";
            found = true;
        }
        current = current->next;
    }
    
    if (!found) {
        ss << "No medicines in this category.\n";
    }
    
    return ss.str();
}

// ============================================================================
// REMINDER NODE IMPLEMENTATION
// ============================================================================

ReminderNode::ReminderNode(const std::string& med, const std::string& t) 
    : medicineName(med), time(t), left(nullptr), right(nullptr) {
    timeValue = timeToValue(t);
}

int ReminderNode::timeToValue(const std::string& time) {
    // Convert HH:MM to HHMM integer for easy comparison
    if (time.length() >= 5) {
        int hours = std::stoi(time.substr(0, 2));
        int minutes = std::stoi(time.substr(3, 2));
        return hours * 100 + minutes;
    }
    return 0;
}

// ============================================================================
// REMINDER SCHEDULER IMPLEMENTATION
// ============================================================================

ReminderScheduler::ReminderScheduler() : root(nullptr), reminderCount(0) {}

ReminderScheduler::~ReminderScheduler() {
    deleteTree(root);
}

void ReminderScheduler::deleteTree(ReminderNode* node) {
    // Post-order deletion: Left-Right-Root
    if (node != nullptr) {
        deleteTree(node->left);
        deleteTree(node->right);
        delete node;
    }
}

ReminderNode* ReminderScheduler::insertNode(ReminderNode* node, const std::string& medicine, const std::string& time) {
    // Base case: found the insertion point
    if (node == nullptr) {
        return new ReminderNode(medicine, time);
    }
    
    int newTimeValue = ReminderNode::timeToValue(time);
    
    // BST insertion logic: smaller times go left, larger times go right
    if (newTimeValue < node->timeValue) {
        node->left = insertNode(node->left, medicine, time);
    } else {
        node->right = insertNode(node->right, medicine, time);
    }
    
    return node;
}

void ReminderScheduler::addReminder(const std::string& medicine, const std::string& time) {
    root = insertNode(root, medicine, time);
    reminderCount++;
}

void ReminderScheduler::inOrderTraversal(ReminderNode* node, std::stringstream& ss) const {
    // In-order traversal: Left-Root-Right (gives sorted order)
    if (node != nullptr) {
        inOrderTraversal(node->left, ss);
        ss << "• " << node->time << " - " << node->medicineName << "\n";
        inOrderTraversal(node->right, ss);
    }
}

std::string ReminderScheduler::getRemindersInOrder() const {
    std::stringstream ss;
    ss << "Scheduled Reminders (" << reminderCount << "):\n";
    
    if (root == nullptr) {
        ss << "No reminders scheduled.\n";
    } else {
        inOrderTraversal(root, ss);
    }
    
    return ss.str();
}

ReminderNode* ReminderScheduler::findMin(ReminderNode* node) {
    while (node->left != nullptr) {
        node = node->left;
    }
    return node;
}

std::string ReminderScheduler::getNextReminder() const {
    if (root == nullptr) {
        return "No upcoming reminders";
    }
    
    // Find leftmost node (earliest time)
    ReminderNode* current = root;
    while (current->left != nullptr) {
        current = current->left;
    }
    
    return current->time + " - " + current->medicineName;
}

ReminderNode* ReminderScheduler::searchNode(ReminderNode* node, const std::string& medicine, const std::string& time) {
    if (node == nullptr) {
        return nullptr;
    }
    
    int searchTimeValue = ReminderNode::timeToValue(time);
    
    if (searchTimeValue == node->timeValue && node->medicineName == medicine) {
        return node;
    } else if (searchTimeValue < node->timeValue) {
        return searchNode(node->left, medicine, time);
    } else {
        return searchNode(node->right, medicine, time);
    }
}

ReminderNode* ReminderScheduler::deleteNode(ReminderNode* node, const std::string& medicine, const std::string& time) {
    if (node == nullptr) {
        return nullptr;
    }
    
    int deleteTimeValue = ReminderNode::timeToValue(time);
    
    if (deleteTimeValue < node->timeValue) {
        node->left = deleteNode(node->left, medicine, time);
    } else if (deleteTimeValue > node->timeValue) {
        node->right = deleteNode(node->right, medicine, time);
    } else if (node->medicineName == medicine) {
        // Node found, delete it
        if (node->left == nullptr) {
            ReminderNode* temp = node->right;
            delete node;
            return temp;
        } else if (node->right == nullptr) {
            ReminderNode* temp = node->left;
            delete node;
            return temp;
        }
        
        // Node has two children
        ReminderNode* temp = findMin(node->right);
        node->medicineName = temp->medicineName;
        node->time = temp->time;
        node->timeValue = temp->timeValue;
        node->right = deleteNode(node->right, temp->medicineName, temp->time);
    }
    
    return node;
}

bool ReminderScheduler::deleteReminder(const std::string& medicine, const std::string& time) {
    ReminderNode* found = searchNode(root, medicine, time);
    if (found == nullptr) {
        return false;
    }
    
    root = deleteNode(root, medicine, time);
    reminderCount--;
    return true;
}

// ============================================================================
// REMINDER QUEUE IMPLEMENTATION
// ============================================================================

ReminderQueue::ReminderQueue() : front(nullptr), rear(nullptr), queueSize(0) {}

ReminderQueue::~ReminderQueue() {
    while (!isEmpty()) {
        dequeue();
    }
}

void ReminderQueue::enqueue(const std::string& medicine, const std::string& time) {
    // Create new queue node
    QueueNode* newNode = new QueueNode(medicine, time);
    
    // If queue is empty
    if (rear == nullptr) {
        front = rear = newNode;
    } else {
        // Add at rear and update rear pointer
        rear->next = newNode;
        rear = newNode;
    }
    
    queueSize++;
}

std::string ReminderQueue::dequeue() {
    // Check if queue is empty
    if (isEmpty()) {
        return "Queue is empty";
    }
    
    // Store front node data
    QueueNode* temp = front;
    std::string result = temp->time + " - " + temp->medicineName;
    
    // Move front pointer
    front = front->next;
    
    // If queue becomes empty, update rear
    if (front == nullptr) {
        rear = nullptr;
    }
    
    delete temp;
    queueSize--;
    
    return result;
}

std::string ReminderQueue::peek() const {
    if (isEmpty()) {
        return "Queue is empty";
    }
    return front->time + " - " + front->medicineName;
}

std::string ReminderQueue::getAllReminders() const {
    std::stringstream ss;
    ss << "Reminder Queue (" << queueSize << "):\n";
    
    if (isEmpty()) {
        ss << "No reminders in queue.\n";
    } else {
        QueueNode* current = front;
        int count = 1;
        while (current != nullptr) {
            ss << count++ << ". " << current->time << " - " << current->medicineName << "\n";
            current = current->next;
        }
    }
    
    return ss.str();
}

// ============================================================================
// UNDO MANAGER IMPLEMENTATION
// ============================================================================

UndoManager::UndoManager() : top(nullptr), stackSize(0) {}

UndoManager::~UndoManager() {
    while (!isEmpty()) {
        pop();
    }
}

void UndoManager::push(const Action& action) {
    // Remove oldest action if stack is full
    if (stackSize >= MAX_HISTORY) {
        // Remove bottom element (requires traversal)
        if (top != nullptr) {
            if (top->next == nullptr) {
                delete top;
                top = nullptr;
            } else {
                StackNode* current = top;
                while (current->next->next != nullptr) {
                    current = current->next;
                }
                delete current->next;
                current->next = nullptr;
            }
            stackSize--;
        }
    }
    
    // Create new node and push to top
    StackNode* newNode = new StackNode(action);
    newNode->next = top;
    top = newNode;
    stackSize++;
}

Action UndoManager::pop() {
    if (isEmpty()) {
        return Action{"EMPTY", "No actions to undo", ""};
    }
    
    // Remove and return top action
    StackNode* temp = top;
    Action action = temp->action;
    top = top->next;
    delete temp;
    stackSize--;
    
    return action;
}

Action UndoManager::peek() const {
    if (isEmpty()) {
        return Action{"EMPTY", "No actions to undo", ""};
    }
    return top->action;
}

std::string UndoManager::getHistory() const {
    std::stringstream ss;
    ss << "Action History (" << stackSize << " recent actions):\n";
    
    if (isEmpty()) {
        ss << "No actions recorded yet.\n";
    } else {
        StackNode* current = top;
        int count = 1;
        while (current != nullptr) {
            ss << count++ << ". " << current->action.type 
               << " - " << current->action.details << "\n";
            current = current->next;
        }
    }
    
    return ss.str();
}

// ============================================================================
// MAIN MEDICINE REMINDER SYSTEM IMPLEMENTATION
// ============================================================================

MedicineReminderSystem::MedicineReminderSystem() {}

bool MedicineReminderSystem::addCategory(const std::string& category) {
    bool success = categoryManager.addCategory(category);
    if (success) {
        Action action;
        action.type = "ADD_CATEGORY";
        action.details = "Added category: " + category;
        undoManager.push(action);
    }
    return success;
}

bool MedicineReminderSystem::removeCategory(const std::string& category) {
    bool success = categoryManager.removeCategory(category);
    if (success) {
        Action action;
        action.type = "REMOVE_CATEGORY";
        action.details = "Removed category: " + category;
        undoManager.push(action);
    }
    return success;
}

std::string MedicineReminderSystem::listCategories() const {
    return categoryManager.getAllCategories();
}

void MedicineReminderSystem::addMedicine(const std::string& name, const std::string& dose, 
                                        const std::string& timings, const std::string& category) {
    medicineManager.addMedicine(name, dose, timings, category);
    
    Action action;
    action.type = "ADD_MEDICINE";
    action.details = "Added medicine: " + name + " (" + category + ")";
    undoManager.push(action);
}

bool MedicineReminderSystem::deleteMedicine(const std::string& name) {
    bool success = medicineManager.deleteMedicine(name);
    if (success) {
        Action action;
        action.type = "DELETE_MEDICINE";
        action.details = "Deleted medicine: " + name;
        undoManager.push(action);
    }
    return success;
}

std::string MedicineReminderSystem::searchMedicine(const std::string& name) const {
    Medicine* med = medicineManager.searchMedicine(name);
    if (med != nullptr) {
        std::stringstream ss;
        ss << "Medicine Found:\n";
        ss << "Name: " << med->name << "\n";
        ss << "Dose: " << med->dose << "\n";
        ss << "Timings: " << med->timings << "\n";
        ss << "Category: " << med->category << "\n";
        return ss.str();
    }
    return "Medicine not found: " + name;
}

std::string MedicineReminderSystem::listAllMedicines() const {
    return medicineManager.getAllMedicines();
}

std::string MedicineReminderSystem::listMedicinesByCategory(const std::string& category) const {
    return medicineManager.getMedicinesByCategory(category);
}

void MedicineReminderSystem::scheduleReminder(const std::string& medicine, const std::string& time) {
    reminderScheduler.addReminder(medicine, time);
    reminderQueue.enqueue(medicine, time);
    
    Action action;
    action.type = "SCHEDULE_REMINDER";
    action.details = "Scheduled reminder: " + medicine + " at " + time;
    undoManager.push(action);
}

std::string MedicineReminderSystem::viewScheduledReminders() const {
    return reminderScheduler.getRemindersInOrder();
}

std::string MedicineReminderSystem::getNextReminder() const {
    return reminderScheduler.getNextReminder();
}

void MedicineReminderSystem::markReminderTaken() {
    std::string taken = reminderQueue.dequeue();
    
    Action action;
    action.type = "MARK_TAKEN";
    action.details = "Marked as taken: " + taken;
    undoManager.push(action);
}

std::string MedicineReminderSystem::viewReminderQueue() const {
    return reminderQueue.getAllReminders();
}

bool MedicineReminderSystem::deleteReminder(const std::string& medicine, const std::string& time) {
    bool success = reminderScheduler.deleteReminder(medicine, time);
    if (success) {
        Action action;
        action.type = "DELETE_REMINDER";
        action.details = "Deleted reminder: " + medicine + " at " + time;
        undoManager.push(action);
    }
    return success;
}

bool MedicineReminderSystem::undoLastAction() {
    if (undoManager.isEmpty()) {
        return false;
    }
    
    Action action = undoManager.pop();
    return true;
}

std::string MedicineReminderSystem::viewActionHistory() const {
    return undoManager.getHistory();
}

std::string MedicineReminderSystem::getSystemStatus() const {
    std::stringstream ss;
    ss << "=== MEDICINE REMINDER SYSTEM STATUS ===\n";
    ss << "Categories: " << categoryManager.getCount() << "\n";
    ss << "Medicines: " << medicineManager.getCount() << "\n";
    ss << "Scheduled Reminders: " << reminderScheduler.getCount() << "\n";
    ss << "Queued Reminders: " << reminderQueue.getSize() << "\n";
    ss << "Action History: " << undoManager.getSize() << " actions\n";
    ss << "Next Reminder: " << getNextReminder() << "\n";
    return ss.str();
}

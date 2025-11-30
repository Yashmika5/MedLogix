#ifndef MEDICINE_REMINDER_SYSTEM_H
#define MEDICINE_REMINDER_SYSTEM_H

#include <string>
#include <ctime>
#include <sstream>
#include <iomanip>

//


const int MAX_CATEGORIES = 10;

class CategoryManager {
private:
    std::string categories[MAX_CATEGORIES];  // Fixed-size array for category storage
    int categoryCount;                        // Current number of categories
    
public:
    
    CategoryManager();
    
     
    bool addCategory(const std::string& category);
    
     
    bool removeCategory(const std::string& category);
    
     
    std::string getCategory(int index) const;
    
    // Get total number of categories
    int getCount() const { return categoryCount; }
    
    // Check if category exists
    // Algorithm: Linear search through array 
    bool exists(const std::string& category) const;
    
    // Get all categories as formatted string
    std::string getAllCategories() const;
};

/// linked list node

struct Medicine {
    std::string name;
    std::string dose;
    std::string timings;
    std::string category;
    int stockQuantity;        // Current stock level
    int lowStockThreshold;    // Alert when stock falls below this value
    Medicine* next;           // Pointer to next medicine in the list
    
    // Constructor for easy node creation with stock tracking
    Medicine(const std::string& n, const std::string& d, const std::string& t, 
             const std::string& c, int stock = 0, int threshold = 90)
        : name(n), dose(d), timings(t), category(c), 
          stockQuantity(stock), lowStockThreshold(threshold), next(nullptr) {}
};

/// linked list
class MedicineManager {
private:
    Medicine* head;  // Pointer to the first medicine in the list
    int medicineCount;
    
public:
   
    MedicineManager();
    
 
    ~MedicineManager();
    
    
bool addMedicine(const std::string& name, const std::string& dose,
                 const std::string& timings, const std::string& category);

     
    void addMedicineWithStock(const std::string& name, const std::string& dose, 
                              const std::string& timings, const std::string& category,
                              int stock, int threshold);
    
    
    bool deleteMedicine(const std::string& name);
    
    
    Medicine* searchMedicine(const std::string& name) const;
    
    
    bool updateStock(const std::string& name, int quantity);
    
    
    bool decreaseStock(const std::string& name, int quantity = 1);
    
    
    bool isLowStock(const std::string& name) const;
    
    
    std::string getLowStockMedicines() const;
    
    
    std::string getStockLevels() const;
    
    // Get all medicines as formatted string
    // Algorithm: Full list traversal O(n)
    std::string getAllMedicines() const;
    
    // Get medicines by category
    // Algorithm: Filtered traversal O(n)
    std::string getMedicinesByCategory(const std::string& category) const;
    
    // Get medicine count
    int getCount() const { return medicineCount; }
    
    // Get head pointer (for iteration)
    Medicine* getHead() const { return head; }
};

/// reminder node 

struct ReminderNode {
    std::string medicineName;
    std::string time;        // Format: HH:MM (24-hour)
    int timeValue;           // Numeric value for BST comparison (HHMM)
    ReminderNode* left;      // Left child (earlier times)
    ReminderNode* right;     // Right child (later times)
    
    // Constructor: Creates a reminder node with time conversion
    ReminderNode(const std::string& med, const std::string& t);
    
    // Convert time string to numeric value for comparison
    static int timeToValue(const std::string& time);
};


/// bst

class ReminderScheduler {
private:
    ReminderNode* root;  // Root of the binary search tree
    int reminderCount;
    
    // Helper: Recursive insertion into BST
    // Algorithm: Compare time values and recursively insert in correct position
    ReminderNode* insertNode(ReminderNode* node, const std::string& medicine, const std::string& time);
    
    
    void inOrderTraversal(ReminderNode* node, std::stringstream& ss) const;
    
    
    void deleteTree(ReminderNode* node);
    
    // Helper: Search for a specific reminder
    ReminderNode* searchNode(ReminderNode* node, const std::string& medicine, const std::string& time);
    
    // Helper: Find minimum value node (leftmost)
    ReminderNode* findMin(ReminderNode* node);
    
    // Helper: Delete a specific node
    ReminderNode* deleteNode(ReminderNode* node, const std::string& medicine, const std::string& time);
    
public:
    ReminderScheduler();
    
    ~ReminderScheduler();
    
    
    void addReminder(const std::string& medicine, const std::string& time);
    
    
    std::string getRemindersInOrder() const;
    
    // Get next upcoming reminder
    std::string getNextReminder() const;
    
    // Delete a reminder
    bool deleteReminder(const std::string& medicine, const std::string& time);
    
    // Get reminder count
    int getCount() const { return reminderCount; }
};

///// queue

struct QueueNode {
    std::string medicineName;
    std::string time;
    QueueNode* next;
    
    QueueNode(const std::string& med, const std::string& t)
        : medicineName(med), time(t), next(nullptr) {}
};


// reminder queu

class ReminderQueue {
private:
    QueueNode* front;  // Pointer to the front of the queue
    QueueNode* rear;   // Pointer to the rear of the queue
    int queueSize;
    
public:
    // Constructor: Initializes an empty queue
    // Algorithm: Sets front and rear to nullptr
    ReminderQueue();
    
    ~ReminderQueue();
    
    
    void enqueue(const std::string& medicine, const std::string& time);
    
   
    std::string dequeue();
    
    // Peek: View the front reminder without removing
    std::string peek() const;
    
    // Check if queue is empty
    bool isEmpty() const { return front == nullptr; }
    
    // Get queue size
    int getSize() const { return queueSize; }
    
    // Get all queue contents
    std::string getAllReminders() const;
};


/// action

struct Action {
    std::string type;          // e.g., "ADD_MEDICINE", "DELETE_MEDICINE"
    std::string name;          // medicine or category name
    std::string dose;          // for medicines
    std::string timings;       // for medicines
    std::string category;      // for medicines/categories
    int oldStock = -1;         // previous stock value to restore
    int quantity = 0;          // quantity changed, e.g., for decrease stock
    std::string reminderTime;  // for reminder scheduling
    std::string details;       // human-readable action description
    std::string timestamp;     // optional timestamp
};


//// stack

struct StackNode {
    Action action;
    StackNode* next;
    
    StackNode(const Action& act) : action(act), next(nullptr) {}
};

/////// Undo manager

class UndoManager {
private:
    StackNode* top;  // Pointer to the top of the stack
    int stackSize;
    const int MAX_HISTORY = 20;  // Limit history to prevent excessive memory use
    
public:
    
    UndoManager();
    
    ~UndoManager();
    
   
    void push(const Action& action);
    
   
    Action pop();
    
    Action peek() const;
    
    bool isEmpty() const { return top == nullptr; }
    
   
    std::string getHistory() const;
    
    // Get stack size
    int getSize() const { return stackSize; }
};


class MedicineReminderSystem {
private:
    CategoryManager categoryManager;
    MedicineManager medicineManager;
    ReminderScheduler reminderScheduler;
    ReminderQueue reminderQueue;
    UndoManager undoManager;
    
public:
    // Constructor
    MedicineReminderSystem();
    
    // Category operations
    bool addCategory(const std::string& category);
    bool removeCategory(const std::string& category);
    bool undo();
    std::string listCategories() const;
    
    // Medicine operations
    void addMedicine(const std::string& name, const std::string& dose, 
                     const std::string& timings, const std::string& category);
    void addMedicineWithStock(const std::string& name, const std::string& dose, 
                              const std::string& timings, const std::string& category,
                              int stock, int threshold);
    bool deleteMedicine(const std::string& name);
    std::string searchMedicine(const std::string& name) const;
    std::string listAllMedicines() const;
    std::string listMedicinesByCategory(const std::string& category) const;
    
    // Stock tracking operations
    bool updateStock(const std::string& name, int quantity);
    bool decreaseStock(const std::string& name, int quantity = 1);
    std::string viewStockLevels() const;
    std::string getLowStockAlerts() const;
    bool checkStockAvailable(const std::string& name) const;
    
    // Reminder operations
    void scheduleReminder(const std::string& medicine, const std::string& time);
    std::string viewScheduledReminders() const;
    std::string getNextReminder() const;
    void markReminderTaken();
    std::string viewReminderQueue() const;
    bool deleteReminder(const std::string& medicine, const std::string& time);
    
    // Undo operations
    bool undoLastAction();
    std::string viewActionHistory() const;
    
    // System status
    std::string getSystemStatus() const;
    
    // Get individual managers
    CategoryManager& getCategoryManager() { return categoryManager; }
    MedicineManager& getMedicineManager() { return medicineManager; }
    ReminderScheduler& getReminderScheduler() { return reminderScheduler; }
    ReminderQueue& getReminderQueue() { return reminderQueue; }
    UndoManager& getUndoManager() { return undoManager; }
};

#endif // MEDICINE_REMINDER_SYSTEM_H

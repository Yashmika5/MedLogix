#ifndef MEDICINE_REMINDER_SYSTEM_H
#define MEDICINE_REMINDER_SYSTEM_H

#include <string>
#include <ctime>
#include <sstream>
#include <iomanip>

// ============================================================================
// CATEGORY MANAGER - ARRAY DATA STRUCTURE
// ============================================================================
// Purpose: Manages medicine categories using a fixed-size array
// Algorithm: Direct indexing for O(1) access, linear search for lookup
// ============================================================================

const int MAX_CATEGORIES = 10;

class CategoryManager {
private:
    std::string categories[MAX_CATEGORIES];  // Fixed-size array for category storage
    int categoryCount;                        // Current number of categories
    
public:
    // Constructor: Initializes the category array with default categories
    // Algorithm: Simple array initialization with predefined medical categories
    CategoryManager();
    
    // Add a new category to the array
    // Algorithm: Linear insertion at the end if space available O(1)
    bool addCategory(const std::string& category);
    
    // Remove a category by name
    // Algorithm: Linear search O(n) followed by shift operation O(n)
    bool removeCategory(const std::string& category);
    
    // Get category by index
    // Algorithm: Direct array indexing O(1)
    std::string getCategory(int index) const;
    
    // Get total number of categories
    int getCount() const { return categoryCount; }
    
    // Check if category exists
    // Algorithm: Linear search through array O(n)
    bool exists(const std::string& category) const;
    
    // Get all categories as formatted string
    std::string getAllCategories() const;
};

// ============================================================================
// MEDICINE NODE - LINKED LIST NODE
// ============================================================================
// Purpose: Represents a single medicine in the linked list
// Structure: Contains medicine data and pointer to next node
// ============================================================================

struct Medicine {
    std::string name;
    std::string dose;
    std::string timings;
    std::string category;
    Medicine* next;  // Pointer to next medicine in the list
    
    // Constructor for easy node creation
    Medicine(const std::string& n, const std::string& d, const std::string& t, const std::string& c)
        : name(n), dose(d), timings(t), category(c), next(nullptr) {}
};

// ============================================================================
// MEDICINE MANAGER - SINGLY LINKED LIST DATA STRUCTURE
// ============================================================================
// Purpose: Manages medicines dynamically using a singly linked list
// Algorithm: Pointer-based traversal for add O(n), delete O(n), search O(n)
// Advantage: Dynamic size, efficient insertion/deletion without shifting
// ============================================================================

class MedicineManager {
private:
    Medicine* head;  // Pointer to the first medicine in the list
    int medicineCount;
    
public:
    // Constructor: Initializes an empty linked list
    // Algorithm: Sets head to nullptr, creating an empty list
    MedicineManager();
    
    // Destructor: Frees all dynamically allocated medicine nodes
    // Algorithm: Traverses list and deletes each node to prevent memory leaks O(n)
    ~MedicineManager();
    
    // Add a new medicine to the linked list
    // Algorithm: Creates new node and inserts at the head O(1)
    void addMedicine(const std::string& name, const std::string& dose, 
                     const std::string& timings, const std::string& category);
    
    // Delete a medicine by name
    // Algorithm: Linear search with pointer manipulation O(n)
    bool deleteMedicine(const std::string& name);
    
    // Search for a medicine by name
    // Algorithm: Linear traversal through linked list O(n)
    Medicine* searchMedicine(const std::string& name) const;
    
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

// ============================================================================
// REMINDER NODE - BINARY SEARCH TREE NODE
// ============================================================================
// Purpose: Represents a scheduled reminder in the BST
// Structure: Contains reminder data and left/right child pointers
// ============================================================================

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

// ============================================================================
// REMINDER SCHEDULER - BINARY SEARCH TREE DATA STRUCTURE
// ============================================================================
// Purpose: Organizes reminders by time using BST for efficient scheduling
// Algorithm: BST insertion O(log n) average, in-order traversal for sorted output
// Advantage: Maintains reminders in chronological order, fast search and insertion
// ============================================================================

class ReminderScheduler {
private:
    ReminderNode* root;  // Root of the binary search tree
    int reminderCount;
    
    // Helper: Recursive insertion into BST
    // Algorithm: Compare time values and recursively insert in correct position
    ReminderNode* insertNode(ReminderNode* node, const std::string& medicine, const std::string& time);
    
    // Helper: Recursive in-order traversal (Left-Root-Right)
    // Algorithm: Visits nodes in ascending time order for chronological display
    void inOrderTraversal(ReminderNode* node, std::stringstream& ss) const;
    
    // Helper: Recursive tree deletion for memory cleanup
    // Algorithm: Post-order deletion (Left-Right-Root) to safely free all nodes
    void deleteTree(ReminderNode* node);
    
    // Helper: Search for a specific reminder
    ReminderNode* searchNode(ReminderNode* node, const std::string& medicine, const std::string& time);
    
    // Helper: Find minimum value node (leftmost)
    ReminderNode* findMin(ReminderNode* node);
    
    // Helper: Delete a specific node
    ReminderNode* deleteNode(ReminderNode* node, const std::string& medicine, const std::string& time);
    
public:
    // Constructor: Initializes an empty BST
    ReminderScheduler();
    
    // Destructor: Frees all BST nodes
    ~ReminderScheduler();
    
    // Add a reminder to the BST
    // Algorithm: BST insertion maintaining time-based ordering O(log n) average
    void addReminder(const std::string& medicine, const std::string& time);
    
    // Get all reminders in chronological order
    // Algorithm: In-order traversal returns sorted reminders O(n)
    std::string getRemindersInOrder() const;
    
    // Get next upcoming reminder
    std::string getNextReminder() const;
    
    // Delete a reminder
    bool deleteReminder(const std::string& medicine, const std::string& time);
    
    // Get reminder count
    int getCount() const { return reminderCount; }
};

// ============================================================================
// QUEUE NODE - REMINDER QUEUE NODE
// ============================================================================
// Purpose: Represents a reminder in the FIFO queue
// Structure: Contains reminder data and pointer to next in queue
// ============================================================================

struct QueueNode {
    std::string medicineName;
    std::string time;
    QueueNode* next;
    
    QueueNode(const std::string& med, const std::string& t)
        : medicineName(med), time(t), next(nullptr) {}
};

// ============================================================================
// REMINDER QUEUE - QUEUE DATA STRUCTURE (FIFO)
// ============================================================================
// Purpose: Manages due reminders in First-In-First-Out order
// Algorithm: Enqueue at rear O(1), Dequeue from front O(1)
// Advantage: Ensures reminders are processed in the order they become due
// ============================================================================

class ReminderQueue {
private:
    QueueNode* front;  // Pointer to the front of the queue
    QueueNode* rear;   // Pointer to the rear of the queue
    int queueSize;
    
public:
    // Constructor: Initializes an empty queue
    // Algorithm: Sets front and rear to nullptr
    ReminderQueue();
    
    // Destructor: Frees all queue nodes
    ~ReminderQueue();
    
    // Enqueue: Add a reminder to the rear of the queue
    // Algorithm: Create new node and link to rear, update rear pointer O(1)
    void enqueue(const std::string& medicine, const std::string& time);
    
    // Dequeue: Remove and return the front reminder
    // Algorithm: Remove front node, update front pointer O(1)
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

// ============================================================================
// ACTION - REPRESENTS A USER ACTION FOR UNDO FUNCTIONALITY
// ============================================================================

struct Action {
    std::string type;        // "ADD_MEDICINE", "DELETE_MEDICINE", "ADD_REMINDER", etc.
    std::string details;     // Details of the action
    std::string timestamp;
};

// ============================================================================
// STACK NODE - UNDO STACK NODE
// ============================================================================

struct StackNode {
    Action action;
    StackNode* next;
    
    StackNode(const Action& act) : action(act), next(nullptr) {}
};

// ============================================================================
// UNDO MANAGER - STACK DATA STRUCTURE (LIFO)
// ============================================================================
// Purpose: Manages undo operations using Last-In-First-Out stack
// Algorithm: Push O(1), Pop O(1)
// Advantage: Most recent action is always at the top for easy undo
// ============================================================================

class UndoManager {
private:
    StackNode* top;  // Pointer to the top of the stack
    int stackSize;
    const int MAX_HISTORY = 20;  // Limit history to prevent excessive memory use
    
public:
    // Constructor: Initializes an empty stack
    // Algorithm: Sets top to nullptr
    UndoManager();
    
    // Destructor: Frees all stack nodes
    ~UndoManager();
    
    // Push: Add an action to the top of the stack
    // Algorithm: Create new node, link to current top, update top pointer O(1)
    void push(const Action& action);
    
    // Pop: Remove and return the top action
    // Algorithm: Remove top node, update top pointer O(1)
    Action pop();
    
    // Peek: View the top action without removing
    Action peek() const;
    
    // Check if stack is empty
    bool isEmpty() const { return top == nullptr; }
    
    // Get action history (recent actions)
    // Algorithm: Traverse stack from top to display recent actions
    std::string getHistory() const;
    
    // Get stack size
    int getSize() const { return stackSize; }
};

// ============================================================================
// MAIN MEDICINE REMINDER SYSTEM
// ============================================================================
// Purpose: Integrates all data structures into a complete system
// Components: CategoryManager, MedicineManager, ReminderScheduler, 
//             ReminderQueue, UndoManager
// ============================================================================

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
    std::string listCategories() const;
    
    // Medicine operations
    void addMedicine(const std::string& name, const std::string& dose, 
                     const std::string& timings, const std::string& category);
    bool deleteMedicine(const std::string& name);
    std::string searchMedicine(const std::string& name) const;
    std::string listAllMedicines() const;
    std::string listMedicinesByCategory(const std::string& category) const;
    
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

// Modern Finance Dashboard - Main JavaScript File

// Supabase Configuration
const SUPABASE_URL = 'https://siqtcjlkkwywvujeooim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcXRjamxra3d5d3Z1amVvb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTIxMjUsImV4cCI6MjA3MjA2ODEyNX0.JgzaELyTZ74ZtW45y7ZGSG3BfxM4FhRoX_kHP7q9ymA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class FinanceDashboard {
    constructor() {
        this.expenses = [];
        this.monthlyBudget = 0;
        this.monthlySavings = 0;
        this.categories = [];
        this.charts = {};
        this.currentTheme = 'light';
        this.deleteExpenseId = null;
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        // Check authentication first
        await this.checkAuth();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        this.setupEventListeners();
        this.setDefaultDate();
        this.setupTheme();
        await this.loadUserData();
        this.updateDashboard();
        this.renderExpensesList();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Authentication - Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
            console.log('Logout button event listener added');
        } else {
            console.error('Logout button not found!');
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Budget management
        document.getElementById('editBudgetBtn').addEventListener('click', () => this.showBudgetModal());
        document.getElementById('saveBudgetBtn').addEventListener('click', () => this.saveBudget());
        document.getElementById('cancelBudgetBtn').addEventListener('click', () => this.hideBudgetModal());
        document.getElementById('closeBudgetModal').addEventListener('click', () => this.hideBudgetModal());

        // Profile modal
        document.getElementById('profileBtn').addEventListener('click', () => this.showProfileModal());
        document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveProfile());
        document.getElementById('closeProfileModal').addEventListener('click', () => this.hideProfileModal());
        document.getElementById('cancelProfileBtn').addEventListener('click', () => this.hideProfileModal());

        // Expense form
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.addExpense(e));
        document.getElementById('clearFormBtn').addEventListener('click', () => this.clearExpenseForm());

        // Category management
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.showCategoryModal());
        document.getElementById('saveCategoryBtn').addEventListener('click', () => this.saveCategory());
        document.getElementById('cancelCategoryBtn').addEventListener('click', () => this.hideCategoryModal());
        document.getElementById('closeCategoryModal').addEventListener('click', () => this.hideCategoryModal());

        // Data management
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => this.importData());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.showDeleteConfirmation());
        document.getElementById('viewAllBtn').addEventListener('click', () => this.viewAllExpenses());

        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.clearAllData());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('closeDeleteModal').addEventListener('click', () => this.hideDeleteModal());

        // Chart period selector
        document.getElementById('chartPeriod').addEventListener('change', () => this.updateCharts());

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideAllModals();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    // Authentication methods
    async checkAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.updateUserDisplay();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }

    updateUserDisplay() {
        const userNameElement = document.getElementById('userName');
        if (this.currentUser?.user_metadata?.name) {
            userNameElement.textContent = this.currentUser.user_metadata.name;
        } else if (this.currentUser?.email) {
            userNameElement.textContent = this.currentUser.email.split('@')[0];
        }
    }

    async logout() {
        try {
            console.log('🚪 Logout function called!');
            console.log('Current user:', this.currentUser?.email);
            
            // Clear any local data
            this.expenses = [];
            this.monthlyBudget = 0;
            this.monthlySavings = 0;
            
            console.log('Local data cleared, signing out from Supabase...');
            
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw error;
            }
            
            console.log('✅ Supabase signout successful');
            console.log('🧹 Clearing localStorage...');
            
            // Clear any stored data and redirect
            localStorage.removeItem('financeDashboardData');
            localStorage.removeItem('dashboardTheme');
            
            console.log('🔄 Redirecting to login page...');
            
            // Redirect to login page
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            this.showNotification('Logout failed. Please try again.', 'error');
        }
    }



    setupTheme() {
        const savedTheme = localStorage.getItem('dashboardTheme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dashboardTheme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').value = today;
    }

    showBudgetModal() {
        document.getElementById('budgetModal').classList.add('active');
        document.getElementById('budgetInput').value = this.monthlyBudget;
        document.getElementById('savingsInput').value = this.monthlySavings;
        document.getElementById('budgetInput').focus();
    }

    hideBudgetModal() {
        document.getElementById('budgetModal').classList.remove('active');
    }

    showProfileModal() {
        const profileModal = document.getElementById('profileModal');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePassword = document.getElementById('profilePassword');
        const profileConfirmPassword = document.getElementById('profileConfirmPassword');

        // Populate form with current user data
        profileName.value = this.currentUser.user_metadata?.name || '';
        profileEmail.value = this.currentUser.email || '';
        profilePassword.value = '';
        profileConfirmPassword.value = '';

        profileModal.classList.add('active');
    }

    hideProfileModal() {
        document.getElementById('profileModal').classList.remove('active');
    }

    async saveProfile() {
        try {
            const profileName = document.getElementById('profileName').value.trim();
            const profilePassword = document.getElementById('profilePassword').value;
            const profileConfirmPassword = document.getElementById('profileConfirmPassword').value;

            if (!profileName || profileName.length < 2) {
                this.showNotification('Please enter a valid name (at least 2 characters).', 'error');
                return;
            }

            // Check if password is being changed
            if (profilePassword) {
                if (profilePassword !== profileConfirmPassword) {
                    this.showNotification('Passwords do not match.', 'error');
                    return;
                }

                if (profilePassword.length < 6) {
                    this.showNotification('Password must be at least 6 characters long.', 'error');
                    return;
                }

                // Update password
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: profilePassword
                });

                if (passwordError) {
                    console.error('Error updating password:', passwordError);
                    this.showNotification('Failed to update password. Please try again.', 'error');
                    return;
                }
            }

            // Update user metadata
            const { error: metadataError } = await supabase.auth.updateUser({
                data: { name: profileName }
            });

            if (metadataError) {
                console.error('Error updating user metadata:', metadataError);
                this.showNotification('Failed to update profile. Please try again.', 'error');
                return;
            }

            // Update user profile in database
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    name: profileName,
                    created_at: new Date().toISOString()
                })
                .eq('id', this.currentUser.id);

            if (profileError) {
                console.error('Error updating user profile:', profileError);
                this.showNotification('Failed to update profile. Please try again.', 'error');
                return;
            }

            // Update current user object
            this.currentUser.user_metadata.name = profileName;

            // Update display
            const userNameElement = document.getElementById('userName');
            userNameElement.textContent = profileName;

            this.hideProfileModal();
            this.showNotification('Profile updated successfully!', 'success');

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Failed to update profile. Please try again.', 'error');
        }
    }

    async saveBudget() {
        try {
            const budgetInput = document.getElementById('budgetInput');
            const savingsInput = document.getElementById('savingsInput');
            const newBudget = parseFloat(budgetInput.value);
            const newSavings = parseFloat(savingsInput.value) || 0;

            if (isNaN(newBudget) || newBudget < 0) {
                this.showNotification('Please enter a valid budget amount', 'error');
                return;
            }

            console.log('Saving budget:', { newBudget, newSavings, userId: this.currentUser.id });

            // Ensure user profile exists first
            await this.ensureUserProfile();

            // Save to Supabase
            const currentMonth = new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear();
            
            const { data, error } = await supabase
                .from('budgets')
                .upsert({
                    user_id: this.currentUser.id,
                    month: currentMonth,
                    total_budget: newBudget,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,month'
                });

            if (error) {
                console.error('Error saving budget to Supabase:', error);
                throw error;
            }

            console.log('Budget saved to Supabase:', data);

            // Update local state
            this.monthlyBudget = newBudget;
            this.monthlySavings = newSavings;
            
            // Update dashboard
            this.updateDashboard();
            this.hideBudgetModal();
            this.showNotification('Budget updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving budget:', error);
            this.showNotification('Failed to save budget. Please try again.', 'error');
        }
    }

    async addExpense(e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;
        const date = document.getElementById('expenseDate').value;
        const description = document.getElementById('expenseDescription').value;

        if (!amount || amount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }

        if (!category) {
            this.showNotification('Please select a category', 'error');
            return;
        }

        if (!date) {
            this.showNotification('Please select a date', 'error');
            return;
        }

        try {
            console.log('Adding expense:', { amount, category, date, description });
            
            // Ensure user profile exists first
            await this.ensureUserProfile();

            // Get or create category
            let categoryId;
            const { data: existingCategory, error: categoryError } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', this.currentUser.id)
                .eq('category_name', category)
                .single();

            if (categoryError && categoryError.code === 'PGRST116') {
                // Category doesn't exist, create it
                console.log('Creating new category:', category);
                const { data: newCategory, error: createError } = await supabase
                    .from('categories')
                    .insert({
                        category_name: category,
                        allocated_budget: 0,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (createError) {
                    throw createError;
                }
                categoryId = newCategory.id;
                console.log('New category created with ID:', categoryId);
                
                // Add to local categories array if not already there
                if (!this.categories.includes(category)) {
                    this.categories.push(category);
                    this.updateCategorySelect();
                }
            } else if (categoryError) {
                throw categoryError;
            } else {
                categoryId = existingCategory.id;
                console.log('Using existing category ID:', categoryId);
            }

            // Save expense to Supabase
            console.log('Saving expense to database with category_id:', categoryId);
            const { data: expense, error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    category_id: categoryId,
                    amount: amount,
                    description: description,
                    date: date,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (expenseError) {
                throw expenseError;
            }
            
            console.log('Expense saved successfully:', expense);

            // Add to local array
            const newExpense = {
                id: expense.id,
                amount: amount,
                category: category,
                date: date,
                description: description,
                timestamp: expense.created_at
            };

            console.log('Adding expense to local array:', newExpense);
            this.expenses.push(newExpense);
            
            console.log('Total expenses in local array:', this.expenses.length);
            
            this.updateDashboard();
            this.renderExpensesList();
            this.updateCharts();
            this.clearExpenseForm();
            this.showNotification('Expense added successfully!', 'success');

        } catch (error) {
            console.error('Error adding expense:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                fullError: error
            });
            this.showNotification(`Failed to add expense: ${error.message}`, 'error');
        }
    }

    clearExpenseForm() {
        document.getElementById('expenseForm').reset();
        this.setDefaultDate();
    }

    renderExpensesList() {
        const expensesList = document.getElementById('expensesList');
        
        if (this.expenses.length === 0) {
            expensesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <h3>No expenses yet</h3>
                    <p>Start tracking your expenses by adding your first one above!</p>
                </div>
            `;
            return;
        }

        // Sort expenses by date (newest first) and show only recent ones
        const sortedExpenses = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentExpenses = sortedExpenses.slice(0, 10); // Show only 10 most recent

        expensesList.innerHTML = recentExpenses.map(expense => `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-icon">${this.getCategoryEmoji(expense.category)}</div>
                <div class="expense-details">
                    <div class="expense-category">${expense.category}</div>
                    ${expense.description ? `<div class="expense-description">${expense.description}</div>` : ''}
                    <div class="expense-date">${this.formatDate(expense.date)}</div>
                </div>
                <div class="expense-amount">-$${expense.amount.toFixed(2)}</div>
                <div class="expense-actions">
                    <button class="action-btn edit-expense-btn" onclick="dashboard.editExpense(${expense.id})" aria-label="Edit expense">
                        ✏️
                    </button>
                    <button class="action-btn delete-expense-btn" onclick="dashboard.deleteExpense(${expense.id})" aria-label="Delete expense">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');

        // Add "View All" indicator if there are more expenses
        if (this.expenses.length > 10) {
            expensesList.innerHTML += `
                <div class="view-all-indicator">
                    <p>Showing 10 of ${this.expenses.length} expenses</p>
                </div>
            `;
        }
    }

    editExpense(id) {
        const expense = this.expenses.find(e => e.id === id);
        if (!expense) return;

        // Populate form with expense data
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expenseDescription').value = expense.description || '';

        // Remove the old expense
        this.deleteExpense(id, false);

        // Scroll to form
        document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('expenseAmount').focus();
        
        this.showNotification('Expense loaded for editing', 'info');
    }

    async deleteExpense(id, showNotification = true) {
        try {
            // Delete from Supabase
            const { error: deleteError } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)
                .eq('user_id', this.currentUser.id);

            if (deleteError) {
                throw deleteError;
            }

            // Remove from local array
            this.expenses = this.expenses.filter(e => e.id !== id);
            this.updateDashboard();
            this.renderExpensesList();
            this.updateCharts();
            
            if (showNotification) {
                this.showNotification('Expense deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showNotification('Failed to delete expense. Please try again.', 'error');
        }
    }

    getCategoryEmoji(category) {
        const emojiMatch = category.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
        return emojiMatch ? emojiMatch[0] : '💰';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    updateDashboard() {
        const currentMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
        const monthlyExpenses = this.expenses.filter(expense => 
            expense.date.startsWith(currentMonth)
        );
        
        console.log('Updating dashboard with monthly expenses:', monthlyExpenses);
        
        const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const remainingBalance = this.monthlyBudget - totalExpenses;
        const spentPercentage = this.monthlyBudget > 0 ? (totalExpenses / this.monthlyBudget) * 100 : 0;

        // Update budget display
        document.getElementById('budgetAmount').textContent = `$${this.monthlyBudget.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('remainingBalance').textContent = `$${remainingBalance.toFixed(2)}`;
        document.getElementById('savingsAmount').textContent = `$${this.monthlySavings.toFixed(2)}`;

        // Update progress bar
        const progressBar = document.getElementById('budgetProgress');
        const spentAmount = document.getElementById('spentAmount');
        const budgetTotal = document.getElementById('budgetTotal');
        
        progressBar.style.width = `${Math.min(spentPercentage, 100)}%`;
        spentAmount.textContent = `$${totalExpenses.toFixed(2)}`;
        budgetTotal.textContent = `$${this.monthlyBudget.toFixed(2)}`;

        // Update balance status with color coding
        const balanceStatus = document.getElementById('balanceStatus');
        if (this.monthlyBudget === 0) {
            balanceStatus.textContent = 'Set your budget';
            balanceStatus.style.color = 'var(--text-muted)';
        } else if (remainingBalance >= 0) {
            balanceStatus.textContent = 'Under budget';
            balanceStatus.style.color = 'var(--success)';
        } else {
            balanceStatus.textContent = 'Over budget';
            balanceStatus.style.color = 'var(--danger)';
        }

        // Update progress bar color based on spending
        if (spentPercentage >= 90) {
            progressBar.style.background = 'var(--gradient-danger)';
        } else if (spentPercentage >= 75) {
            progressBar.style.background = 'var(--gradient-warning)';
        } else {
            progressBar.style.background = 'var(--gradient-success)';
        }
    }

    initializeCharts() {
        this.createPieChart();
        this.createBarChart();
    }

    createPieChart() {
        const ctx = document.getElementById('pieChart').getContext('2d');
        
        this.charts.pie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
                        '#ec4899', '#06b6d4', '#ef4444', '#84cc16', '#6b7280'
                    ],
                    borderWidth: 2,
                    borderColor: 'var(--bg-secondary)',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            color: 'var(--text-primary)',
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'var(--bg-secondary)',
                        titleColor: 'var(--text-primary)',
                        bodyColor: 'var(--text-secondary)',
                        borderColor: 'var(--border-color)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createBarChart() {
        const ctx = document.getElementById('barChart').getContext('2d');
        
        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Budget', 'Expenses'],
                datasets: [{
                    label: 'Amount ($)',
                    data: [0, 0],
                    backgroundColor: ['var(--primary)', 'var(--danger)'],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'var(--bg-secondary)',
                        titleColor: 'var(--text-primary)',
                        bodyColor: 'var(--text-secondary)',
                        borderColor: 'var(--border-color)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'var(--border-color)'
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'var(--text-secondary)'
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        this.updatePieChart();
        this.updateBarChart();
    }

    updatePieChart() {
        if (!this.charts.pie) return;

        const currentMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
        const monthlyExpenses = this.expenses.filter(expense => 
            expense.date.startsWith(currentMonth)
        );

        console.log('Updating pie chart with expenses:', monthlyExpenses);

        if (monthlyExpenses.length === 0) {
            // No expenses, show empty state
            this.charts.pie.data.labels = ['No expenses yet'];
            this.charts.pie.data.datasets[0].data = [1];
            this.charts.pie.data.datasets[0].backgroundColor = ['#6b7280'];
        } else {
            const categoryTotals = {};
            monthlyExpenses.forEach(expense => {
                const category = expense.category;
                categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
            });

            const labels = Object.keys(categoryTotals);
            const data = Object.values(categoryTotals);

            console.log('Category totals:', categoryTotals);

            this.charts.pie.data.labels = labels;
            this.charts.pie.data.datasets[0].data = data;
            this.charts.pie.data.datasets[0].backgroundColor = [
                '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
                '#ec4899', '#06b6d4', '#ef4444', '#84cc16', '#6b7280'
            ];
        }

        this.charts.pie.update('active');
    }

    updateBarChart() {
        if (!this.charts.bar) return;

        const currentMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
        const monthlyExpenses = this.expenses.filter(expense => 
            expense.date.startsWith(currentMonth)
        );
        
        const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        console.log('Updating bar chart:', { budget: this.monthlyBudget, expenses: totalExpenses });

        this.charts.bar.data.datasets[0].data = [this.monthlyBudget, totalExpenses];
        this.charts.bar.update('active');
    }

    showCategoryModal() {
        document.getElementById('categoryModal').classList.add('active');
        document.getElementById('newCategoryName').focus();
    }

    hideCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        document.getElementById('categoryForm').reset();
    }

    async saveCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        const emoji = document.getElementById('newCategoryEmoji').value.trim();

        if (!name || !emoji) {
            this.showNotification('Please fill in both fields', 'error');
            return;
        }

        const newCategory = `${name} ${emoji}`;
        
        if (this.categories.includes(newCategory)) {
            this.showNotification('Category already exists', 'error');
            return;
        }

        try {
            // Save category to Supabase
            const { data: category, error: categoryError } = await supabase
                .from('categories')
                .insert({
                    user_id: this.currentUser.id,
                    category_name: newCategory,
                    allocated_budget: 0,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (categoryError) {
                throw categoryError;
            }

            this.categories.push(newCategory);
            
            // Update the select dropdown
            const select = document.getElementById('expenseCategory');
            const option = document.createElement('option');
            option.value = newCategory;
            option.textContent = newCategory;
            select.appendChild(option);

            this.hideCategoryModal();
            this.showNotification('Category added successfully!', 'success');

        } catch (error) {
            console.error('Error adding category:', error);
            this.showNotification('Failed to add category. Please try again.', 'error');
        }
    }

    exportData() {
        const data = {
            expenses: this.expenses,
            monthlyBudget: this.monthlyBudget,
            monthlySavings: this.monthlySavings,
            categories: this.categories,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budgetmaster-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.expenses && data.monthlyBudget !== undefined) {
                        this.expenses = data.expenses || [];
                        this.monthlyBudget = data.monthlyBudget || 0;
                        this.monthlySavings = data.monthlySavings || 0;
                        this.categories = data.categories || this.categories;
                        
                        this.saveData();
                        this.updateDashboard();
                        this.renderExpensesList();
                        this.updateCharts();
                        
                        // Update category dropdown
                        this.updateCategoryDropdown();
                        
                        this.showNotification('Data imported successfully!', 'success');
                    } else {
                        throw new Error('Invalid data format');
                    }
                } catch (error) {
                    this.showNotification('Error importing data. Please check the file format.', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    updateCategoryDropdown() {
        const select = document.getElementById('expenseCategory');
        select.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    showDeleteConfirmation() {
        this.deleteExpenseId = 'all';
        document.getElementById('deleteModal').classList.add('active');
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.deleteExpenseId = null;
    }

    async clearAllData() {
        try {
            // Clear expenses from Supabase
            const { error: expensesError } = await supabase
                .from('expenses')
                .delete()
                .eq('user_id', this.currentUser.id);

            if (expensesError) {
                throw expensesError;
            }

            // Clear budget from Supabase
            const currentMonth = new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear();
            const { error: budgetError } = await supabase
                .from('budgets')
                .delete()
                .eq('user_id', this.currentUser.id)
                .eq('month', currentMonth);

            if (budgetError) {
                console.error('Error clearing budget:', budgetError);
            }

            this.expenses = [];
            this.monthlyBudget = 0;
            this.monthlySavings = 0;
            this.updateDashboard();
            this.renderExpensesList();
            this.updateCharts();
            this.hideDeleteModal();
            this.showNotification('All data cleared successfully!', 'success');
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showNotification('Failed to clear data. Please try again.', 'error');
        }
    }

    viewAllExpenses() {
        // For now, just show a notification. In a real app, this could open a detailed view
        this.showNotification('View all expenses feature coming soon!', 'info');
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            box-shadow: var(--card-shadow);
            z-index: 3000;
            transform: translateX(400px);
            transition: transform var(--transition-normal);
            max-width: 300px;
            font-family: 'Inter', sans-serif;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    async loadUserData() {
        try {
            // Ensure user profile exists first
            await this.ensureUserProfile();

            // Load user profile
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error loading user profile:', profileError);
            }

            // Load categories
            const { data: categories, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: true });

            if (categoriesError) {
                console.error('Error loading categories:', categoriesError);
            } else {
                this.categories = categories.map(cat => cat.category_name);
                this.updateCategorySelect();
            }

            // Create default categories if user has none
            if (this.categories.length === 0) {
                await this.createDefaultCategories();
            }

            // Load current month's budget
            const currentMonth = new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear();
            const { data: budget, error: budgetError } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('month', currentMonth)
                .single();

            if (budgetError && budgetError.code !== 'PGRST116') {
                console.error('Error loading budget:', budgetError);
            } else if (budget) {
                this.monthlyBudget = budget.total_budget;
            }

            // Load expenses for current month with proper join
            const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select(`
                    id,
                    amount,
                    description,
                    date,
                    created_at,
                    categories!inner(category_name)
                `)
                .eq('user_id', this.currentUser.id)
                .gte('date', currentMonthStart)
                .lte('date', currentMonthEnd)
                .order('date', { ascending: false });

            if (expensesError) {
                console.error('Error loading expenses:', expensesError);
            } else {
                this.expenses = expenses.map(exp => ({
                    id: exp.id,
                    amount: exp.amount,
                    category: exp.categories.category_name,
                    date: exp.date,
                    description: exp.description,
                    timestamp: exp.created_at
                }));
                
                console.log('Loaded expenses:', this.expenses);
            }

            // Force refresh charts after data is loaded
            setTimeout(() => {
                this.updateCharts();
            }, 100);

        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async saveData() {
        try {
            // Save current month's budget
            const currentMonth = new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear();
            
            const { error: budgetError } = await supabase
                .from('budgets')
                .upsert({
                    user_id: this.currentUser.id,
                    month: currentMonth,
                    total_budget: this.monthlyBudget,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,month'
                });

            if (budgetError) {
                console.error('Error saving budget:', budgetError);
            }

        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    async createDefaultCategories() {
        const defaultCategories = [
            'Food 🍔',
            'Shopping 🛍️',
            'Bills 💡',
            'Transportation 🚗',
            'Entertainment 🎬',
            'Healthcare 🏥',
            'Education 📚',
            'Travel ✈️',
            'Utilities 🔧',
            'Other 📦'
        ];

        try {
            for (const categoryName of defaultCategories) {
                const { error } = await supabase
                    .from('categories')
                    .insert({
                        user_id: this.currentUser.id,
                        category_name: categoryName,
                        allocated_budget: 0,
                        created_at: new Date().toISOString()
                    });

                if (error) {
                    console.error(`Error creating category ${categoryName}:`, error);
                }
            }

            // Reload categories after creating defaults
            const { data: categories, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: true });

            if (!categoriesError) {
                this.categories = categories.map(cat => cat.category_name);
                this.updateCategorySelect();
            }

            console.log('Default categories created successfully');
        } catch (error) {
            console.error('Error creating default categories:', error);
        }
    }

    async ensureUserProfile() {
        try {
            // Check if user profile exists
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                // Profile doesn't exist, create it
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: this.currentUser.id,
                        name: this.currentUser.user_metadata?.name || this.currentUser.email?.split('@')[0] || 'User',
                        email: this.currentUser.email,
                        created_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.error('Error creating user profile:', insertError);
                    throw insertError;
                }

                console.log('User profile created successfully');
            } else if (profileError) {
                console.error('Error checking user profile:', profileError);
                throw profileError;
            }
        } catch (error) {
            console.error('Error ensuring user profile:', error);
            throw error;
        }
    }

    updateCategorySelect() {
        const categorySelect = document.getElementById('expenseCategory');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select a category</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }

    addSampleData() {
        if (this.expenses.length === 0) {
            const sampleExpenses = [
                { id: Date.now() - 4, amount: 45.50, category: 'Food 🍔', date: new Date().toISOString().split('T')[0], description: 'Lunch at restaurant', timestamp: new Date().toISOString() },
                { id: Date.now() - 3, amount: 120.00, category: 'Shopping 🛍️', date: new Date().toISOString().split('T')[0], description: 'New clothes', timestamp: new Date().toISOString() },
                { id: Date.now() - 2, amount: 85.00, category: 'Bills 💡', date: new Date().toISOString().split('T')[0], description: 'Electricity bill', timestamp: new Date().toISOString() },
                { id: Date.now() - 1, amount: 35.00, category: 'Transportation 🚗', date: new Date().toISOString().split('T')[0], description: 'Gas station', timestamp: new Date().toISOString() },
                { id: Date.now() - 5, amount: 65.00, category: 'Entertainment 🎬', date: new Date().toISOString().split('T')[0], description: 'Movie tickets', timestamp: new Date().toISOString() }
            ];
            
            this.expenses = sampleExpenses;
            this.monthlyBudget = 2500;
            this.monthlySavings = 500;
            this.saveData();
            this.updateDashboard();
            this.renderExpensesList();
            this.updateCharts();
        }
    }
}

// Initialize the dashboard when the page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new FinanceDashboard();
});

// Add notification styles to the page
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        font-family: 'Inter', sans-serif;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .view-all-indicator {
        text-align: center;
        padding: 1rem;
        color: var(--text-muted);
        font-size: 0.875rem;
        border-top: 1px solid var(--border-light);
        margin-top: 1rem;
    }
`;

document.head.appendChild(notificationStyles);

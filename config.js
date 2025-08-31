// BudgetMaster Configuration File
// Replace these values with your actual Supabase credentials

const config = {
    // Supabase Configuration
    SUPABASE_URL: 'https://siqtcjlkkwywvujeooim.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcXRjamxra3d5d3Z1amVvb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTIxMjUsImV4cCI6MjA3MjA2ODEyNX0.JgzaELyTZ74ZtW45y7ZGSG3BfxM4FhRoX_kHP7q9ymA',
    
    // App Configuration
    APP_NAME: 'BudgetMaster',
    APP_VERSION: '2.0.0',
    
    // Default Settings
    DEFAULT_CURRENCY: 'USD',
    DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',
    
    // Chart Colors (you can customize these)
    CHART_COLORS: [
        '#10b981', // Green
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#ef4444', // Red
        '#84cc16', // Lime
        '#6b7280'  // Gray
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.config = config;
}


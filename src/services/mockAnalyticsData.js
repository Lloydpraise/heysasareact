export const mockDashboardData = {
    overview: { 
        totalRevenue: 5000, 
        activeUsers: 150,
        chartData: [
            { name: 'Mon', revenue: 4000 },
            { name: 'Tue', revenue: 3000 },
            { name: 'Wed', revenue: 5000 },
            { name: 'Thu', revenue: 4500 },
            { name: 'Fri', revenue: 6000 },
        ]
    },
    market: { 
        share: '15%', 
        trend: 'up',
        chartData: [
            { name: 'Us', value: 15 },
            { name: 'Competitors', value: 85 }
        ]
    },
    ads: { 
        spend: 1200, 
        roas: 2.5,
        chartData: [
            { name: 'Campaign A', spend: 400, conversions: 20 },
            { name: 'Campaign B', spend: 500, conversions: 35 },
            { name: 'Campaign C', spend: 300, conversions: 15 }
        ]
    },
    demand: { 
        score: 85, 
        topKeyword: 'services',
        chartData: [
            { name: 'Week 1', score: 70 },
            { name: 'Week 2', score: 75 },
            { name: 'Week 3', score: 82 },
            { name: 'Week 4', score: 85 }
        ]
    },
    timing: { 
        bestTime: '10:00 AM', 
        bestDay: 'Tuesday' 
    },
    health: { 
        status: 'Good', 
        uptime: '99.9%' 
    }
};
export const mockPrefs = {
  followup_enabled:       true,
  zone_recent_days:       7,
  zone_medium_days:       14,
  zone_recent_mode:       'approval',
  zone_medium_mode:       'manual',
  zone_old_mode:          'auto',
  max_per_lead:           12,
  daily_cap:              40,
  lifetime_sent:          243,
  quiet_start:            21,
  quiet_end:              8,
  active_days:            [1,2,3,4,5],
  stop_at_stage:          'paid',
  alert_at_stage:         'intent',
  nudge_enabled:          true,
  nudge_min_pending:      3,
  nudge_interval_hrs:     2,
  hot_lead_alert:         true,
  hot_lead_threshold:     8,
};

export const mockMaterials = [
  { id: 1, type: 'testimonial', title: 'James, Lavington',    content: 'Installation was done in 3 hours, everything worked perfectly from day one. Best money I spent this year.', is_active: true,  expires_at: null, fileName: null },
  { id: 2, type: 'testimonial', title: 'Grace Njoroge',       content: 'No more KPLC bills! Paid itself back in 8 months. Highly recommend to anyone working from home.', is_active: true,  expires_at: null, fileName: null },
  { id: 3, type: 'tip',         title: 'Priority Mode Tip',   content: 'Setting your inverter to priority mode saves up to 20% more power in the first month. Most people don\'t know this.', is_active: true,  expires_at: null, fileName: null },
  { id: 4, type: 'offer',       title: '10% Early Bird Offer',content: 'Get 10% off any system installed this month. Just mention this offer when booking.', is_active: true,  expires_at: new Date(Date.now() + 15*24*60*60*1000).toISOString(), fileName: 'promo-banner.jpg' },
];

export const mockBusiness = {
  name:        'SolarTech Kenya',
  currency:    'KES',
  timezone:    'Africa/Nairobi',
  language:    'auto',
  owner_phone: '+254 712 345 678',
  website_url: 'https://solartech.co.ke',
};

export const mockBalance = { 
  balance_usd: 4.23, 
  spent_this_month: 1.77, 
  spent_all_time: 12.45, 
  followups_sent: 127, 
  won_leads: 3 
};
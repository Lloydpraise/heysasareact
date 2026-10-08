// What the panel offers for each place Ask HeySasa can be opened from.
export const SURFACE_UI = {
  campaign_message: {
    title: 'Write this message',
    placeholder: 'Type your rough idea, like "remind them the offer ends Friday"…',
    starters: ['Gently remind them we are here', 'Tell them about a new offer', 'Ask if they are still interested', 'Thank them and ask for a review'],
    chips: ['Shorter', 'Friendlier', 'More urgent', 'In Swahili', 'Different angle'],
  },
  auto_campaign_playbook: {
    title: 'Write this playbook',
    placeholder: 'Describe how you like to follow up these leads…',
    starters: ['Be warm, never pushy', 'Focus on getting a quick yes', 'Win back leads who went quiet'],
    chips: ['Shorter', 'Warmer', 'More direct', 'Add things to avoid'],
  },
  flow: {
    title: 'Write this flow',
    placeholder: 'Tell me who these customers are and what a good chat looks like…',
    starters: ['People who came from my ad and ask the price', 'Customers asking about delivery', 'Someone ready to buy but unsure about size'],
    chips: ['Shorter', 'Add a hand-off to me', 'Ask fewer questions', 'More detail'],
  },
  product_description: {
    title: 'Write this description',
    placeholder: 'What is the product? Add size, material and who it is for…',
    starters: [],
    chips: ['Shorter', 'More appealing', 'Add details'],
  },
  general: {
    title: 'Ask HeySasa',
    placeholder: 'Ask me anything, or tell me what to do…',
    starters: ['What should I do first?', 'How is my business doing?', 'Who should I follow up with today?', 'Explain my numbers to me', 'Make a list of people who asked about price'],
    chips: [],
  },
};

export const SURFACE_LABEL = {
  campaign_message: 'Campaign message',
  auto_campaign_playbook: 'Auto-campaign playbook',
  flow: 'Chat AI flow',
  product_description: 'Product',
  general: 'General',
};

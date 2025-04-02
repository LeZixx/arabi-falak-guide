
# النجم العربي - Arabic Astrology Telegram Bot Simulator

This is a simulator for an Arabic astrology Telegram bot. It demonstrates how such a bot would work, with features like:

- Support for 21 Arabic dialects
- Personalized horoscope based on birth details
- Multiple horoscope types (daily, love, career, health)
- Subscription tiers with premium features
- Open-ended questions in higher subscription tiers

## Features

### User Data Collection
- Collects date of birth, time of birth, and birthplace
- Stores dialect preference from 21 Arabic dialects
- Saves data persistently in localStorage (would be Firebase in production)

### Dialect Support
- Full support for 21 Arabic dialects, including all regional variations
- Modern Standard Arabic (Fusha) option
- Dialect-specific responses and greetings

### Horoscope Types
- Daily horoscope
- Love horoscope
- Career horoscope
- Health horoscope
- Personalized questions and answers

### Subscription Tiers
- Free tier: Weekly horoscope
- Tier 1: Daily horoscope
- Tier 2: Daily + 1 topic
- Tier 3: Daily + all topics
- Tier 4: All features + unlimited questions

### Commands
- `/start` – Begin onboarding
- `/mydata` – View saved information
- `/change_dialect` – Switch dialect
- `/subscribe` – View/upgrade subscription
- `/horoscope` – Get daily reading
- `/love`, `/career`, `/health` – Topic horoscopes
- `/ask` – Ask custom questions (premium)

## Implementation Details

### Frontend
- Built with React + TypeScript
- Styled with Tailwind CSS and shadcn/ui components
- Mobile-responsive design mimicking Telegram UI

### User Experience
- Realistic chat interface
- Simulated typing and response delays
- Spiritual emojis and mystical styling
- Arabic RTL support

### Data Storage
- User data stored in localStorage (for demo)
- Production version would use Firebase Realtime Database

### Subscription Management
- Simulated subscription management
- Production version would integrate Stripe or Telegram's payment system

## Setup for Telegram Production

To deploy this as a real Telegram bot, you would need to:

1. Create a new Telegram bot via BotFather
2. Get your API Token
3. Set up a Node.js or Python backend to handle the Telegram Bot API
4. Integrate OpenAI GPT-4 for responses
5. Connect to a real database (Firebase recommended)
6. Set up payment processing with Stripe or Telegram payments
7. Deploy to a hosting service

## Credits

- Designed and developed as a demonstration of Arabic astrology bot capabilities
- Supports all major Arabic dialects
- Respectful, spiritual tone with cultural sensitivity

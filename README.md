# Discord Slot Sales Bot

A comprehensive Discord bot for managing game server slot sales with ticket system, payment processing, and automated server management.

## Features

### For Members
- **Purchase Slots**: Buy slots for x8 boost game servers
- **Ticket System**: Automated ticket creation with approval workflow
- **Server Information**: View active servers and their status
- **Purchase History**: Track your purchase history

### For Staff
- **Server Management**: Open new servers with custom duration and pricing
- **Approval System**: Approve/decline purchase requests
- **Boost Activation**: Activate server boosts when slots are filled
- **Audit Logging**: Track all bot activities

### Automated Features
- Auto role assignment for approved buyers
- Auto channel creation for server chatrooms
- Auto boost expiration handling
- Dynamic dropdown menus that update automatically
- Payment QR code display

## Setup Instructions

### 1. Prerequisites
- Node.js v16.9.0 or higher
- MongoDB database
- Discord Bot Token

### 2. Installation

```bash
# Install dependencies
npm install discord.js mongodb dotenv
```

### 3. Environment Configuration

Your `.env` file should contain:
```env
BOT_TOKEN=your_bot_token_here
BOT_ID=your_bot_client_id_here
MONGO_DB=your_mongodb_connection_string_here
```

### 4. Bot Permissions

Ensure your bot has the following permissions:
- Manage Roles
- Manage Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Use Application Commands

### 5. Running the Bot

```bash
node src/index.js
```

## Configuration Commands

### Initial Setup
Run these commands in your Discord server:

```
/configure chatroom-category [category]
/configure ticket-category [category]
/configure staff-role [role]
/configure approval-channel [channel]
/configure audit-channel [channel]
/configure qris-url [image_url]
```

### View Configuration
```
/configure view
```

## Usage Guide

### Opening a Server
1. Staff uses `/open [duration] [price]`
2. Bot creates server role and channel automatically
3. Server appears in purchase panel

### Member Purchase Flow
1. Member selects server from purchase panel
2. Enters number of slots needed
3. Provides Roblox usernames (one per line)
4. Confirms purchase details
5. Ticket channel is created
6. Payment QR code is displayed
7. Waits for staff approval

### Staff Approval Flow
1. Approval request appears in approval channel
2. Staff verifies payment
3. Clicks Approve or Decline
4. If approved:
   - User gets server role
   - User gets access to server chatroom
   - Slot count is updated

### Activating Boost
1. When server reaches 20/20 slots
2. Staff uses admin panel
3. Selects server to activate
4. Boost countdown begins
5. Server auto-closes when boost expires

## Panel Commands

### Send Panels
```
/send server-panel [channel]     # Member information panel
/send purchase-panel [channel]   # Purchase panel with dropdown
/send admin-panel [channel]      # Staff boost activation panel
```

## Additional Commands

```
/servers                         # View all active servers
/mypurchases                     # View your purchase history
```

## Database Collections

- **config**: Bot configuration settings
- **servers**: Active game servers
- **tickets**: Support tickets
- **purchases**: Purchase records

## Workflow

1. **Server Opening**
   - Staff opens server with `/open`
   - System creates role & channel
   - Server becomes available for purchase

2. **Purchase Process**
   - Member selects server
   - Provides slot count & Roblox usernames
   - Ticket created automatically
   - Payment info displayed

3. **Approval**
   - Staff verifies payment
   - Approves/declines ticket
   - System assigns role & channel access

4. **Boost Activation**
   - Server fills (20/20 slots)
   - Staff activates boost
   - Countdown timer starts

5. **Auto Cleanup**
   - Boost expires after duration
   - System marks server inactive
   - Notification sent to members

## Support

For issues or questions, please check:
- Audit log channel for system events
- Configuration settings with `/configure view`
- Server status with `/servers`

## File Structure

```
src/
├── index.js                 # Main bot file
├── config.js               # Bot configuration
├── database.js             # MongoDB operations
├── commands/               # Slash commands
│   ├── configure.js
│   ├── send.js
│   ├── open.js
│   ├── servers.js
│   └── mypurchases.js
├── functions/
│   ├── buttons/           # Button handlers
│   │   ├── approve.js
│   │   ├── decline.js
│   │   ├── confirmPurchase.js
│   │   ├── cancelPurchase.js
│   │   └── closeTicket.js
│   ├── selectMenus/       # Dropdown handlers
│   │   ├── serverInfo.js
│   │   ├── purchase.js
│   │   └── activateBoost.js
│   └── modals/            # Modal handlers
│       ├── slotCount.js
│       └── robloxNames.js
└── utilities/
    ├── embedBuilder.js    # Embed templates
    └── boostChecker.js    # Auto expiration handler
```

## Notes

- Maximum 20 slots per server
- Slot count must match Roblox usernames provided
- Boost duration is in hours (1-72)
- Price is in IDR
- Tickets auto-close after decline (5 min delay)
- Expired servers auto-cleanup

## License

ISC

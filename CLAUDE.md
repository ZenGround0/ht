# New Treasure Hunt - Architecture Guide

This document provides a comprehensive guide for creating a new treasure hunt that matches the architecture of the one in the `th` directory. The new hunt will have different themes, clues, and content but maintain the same security structure and code patterns.

## Architecture Overview

The treasure hunt is a **static website** with client-side security that uses:
- SHA-256 hashing for answer validation
- AES-GCM encryption for protecting clue progression
- LocalStorage for progress tracking
- No backend required - can be hosted on GitHub Pages

## Core Components

### 1. File Structure
```
ht/
├── index.html              # Landing page with instructions
├── clue1_[name].html      # First clue (single-word answer)
├── clue2_[name].html      # Sequential clue pages
├── clue3_[name].html      # Two-word answer format
├── clue4_[name].html      
├── clue5_[name].html      # Three-word answer format
├── clue6_[name].html      
├── clue7_[name].html      
├── clue8_[name].html      
├── final-[name].html      # Completion page
├── crypto-utils.js        # Encryption/decryption utilities (copy from th/)
├── clues.js              # Encrypted mapping data (generate new)
├── styles.css            # Styling (create new theme)
├── test-secure-flow.html # Development testing page
└── CNAME                 # If using custom domain
```

### 2. Security Implementation

#### Password Flow
1. User enters answer(s)
2. Answer normalized: `answer.toLowerCase().trim()`
3. Multi-word answers joined with hyphens: `word1-word2-word3`
4. Answer hashed with SHA-256
5. Hash looked up in `SECURE_CLUES_MAP`
6. If found, encrypted value decrypted using answer as key
7. On success, redirect to decrypted filename

#### Encryption Details
- **Algorithm**: AES-GCM
- **Key Derivation**: PBKDF2, 100,000 iterations
- **Salt**: "treasure-hunt-2025" (consider changing for new hunt)
- **Key Size**: 256 bits
- **IV Size**: 12 bytes
- **Auth Tag**: 16 bytes

### 3. Required Files to Create

#### crypto-utils.js
Copy directly from `th/crypto-utils.js` - no changes needed.

#### clues.js
Generate new encrypted mappings:
```javascript
const SECURE_CLUES_MAP = {
  // SHA256(answer): Encrypted(answer, next_filename)
  "hash1": "encrypted_data1",
  "hash2": "encrypted_data2",
  // ...
};
```

## Implementation Checklist

### Phase 1: Planning
- [ ] Define theme for new treasure hunt
- [ ] Create 8-10 clues with answers
- [ ] Decide on answer formats (single word, two words, three words)
- [ ] Map answers to next clue filenames

### Phase 2: Setup
- [ ] Copy `crypto-utils.js` from th/
- [ ] Create `test-secure-flow.html` for testing
- [ ] Generate encrypted mappings
- [ ] Create `clues.js` with encrypted data

### Phase 3: Content Creation
- [ ] Create `index.html` landing page
- [ ] Create each clue HTML page
- [ ] Create final completion page
- [ ] Design new CSS theme in `styles.css`

### Phase 4: Testing
- [ ] Test each clue progression
- [ ] Verify progress tracking works
- [ ] Test on mobile devices
- [ ] Validate all answer formats

### Phase 5: Deployment
- [ ] Configure GitHub Pages
- [ ] Set up custom domain (optional)
- [ ] Test live deployment

## Code Templates

### Basic Clue Page Template (Single Word Answer)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clue #X - [Theme] Hunt</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <nav>
            <a href="index.html" class="nav-link">Back to Start</a>
        </nav>
        
        <h1>Clue #X</h1>
        
        <div class="clue-content">
            <p>[Your clue text here]</p>
        </div>
        
        <form id="clueForm">
            <input type="text" id="answer" placeholder="Enter your answer" required>
            <button type="submit">Submit Answer</button>
        </form>
        
        <div id="message" class="message"></div>
        
        <details class="hint-container">
            <summary>Need a hint?</summary>
            <p>[Your hint text here]</p>
        </details>
    </div>
    
    <script type="module">
        import { sha256, decrypt } from './crypto-utils.js';
        import { SECURE_CLUES_MAP } from './clues.js';
        
        document.getElementById('clueForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const answer = document.getElementById('answer').value.toLowerCase().trim();
            const messageDiv = document.getElementById('message');
            
            try {
                const hash = await sha256(answer);
                const encryptedData = SECURE_CLUES_MAP[hash];
                
                if (!encryptedData) {
                    throw new Error('Incorrect answer');
                }
                
                const nextPage = await decrypt(encryptedData, answer);
                
                // Update progress
                let progress = JSON.parse(localStorage.getItem('hunt2025_progress') || '[]');
                if (!progress.includes(answer)) {
                    progress.push(answer);
                    localStorage.setItem('hunt2025_progress', JSON.stringify(progress));
                }
                
                messageDiv.textContent = 'Correct! Redirecting...';
                messageDiv.className = 'message success';
                
                setTimeout(() => {
                    window.location.href = nextPage;
                }, 1500);
                
            } catch (error) {
                messageDiv.textContent = 'That\'s not quite right. Try again!';
                messageDiv.className = 'message error';
                setTimeout(() => {
                    messageDiv.textContent = '';
                    messageDiv.className = 'message';
                }, 3000);
            }
        });
    </script>
</body>
</html>
```

### Multi-Word Answer Template (Two Words)
```html
<!-- Same structure as above, but with multiple input fields -->
<form id="clueForm">
    <div class="word-inputs">
        <input type="text" id="word1" placeholder="First word" required>
        <input type="text" id="word2" placeholder="Second word" required>
    </div>
    <button type="submit">Submit Answer</button>
</form>

<script type="module">
    // In the submit handler:
    const word1 = document.getElementById('word1').value.toLowerCase().trim();
    const word2 = document.getElementById('word2').value.toLowerCase().trim();
    const answer = `${word1}-${word2}`;
    // Rest of validation logic...
</script>
```

### Generating Encrypted Mappings Script
```javascript
// Use this in browser console or Node.js to generate clues.js content
async function generateCluesMap(mappings) {
    const SECURE_CLUES_MAP = {};
    
    for (const [answer, nextPage] of Object.entries(mappings)) {
        const hash = await sha256(answer);
        const encrypted = await encrypt(nextPage, answer);
        SECURE_CLUES_MAP[hash] = encrypted;
    }
    
    console.log('const SECURE_CLUES_MAP = ' + JSON.stringify(SECURE_CLUES_MAP, null, 2) + ';');
}

// Example usage:
const mappings = {
    "answer1": "clue2_name.html",
    "answer2": "clue3_name.html",
    "word1-word2": "clue4_name.html",
    // ...
};
generateCluesMap(mappings);
```

## Theme Ideas

Consider these alternative themes to the watermelon theme:
- **Space Explorer**: Stars, planets, cosmic backgrounds
- **Ocean Mystery**: Underwater, marine life, treasure maps
- **Time Traveler**: Different historical eras
- **Fantasy Quest**: Dragons, magic, medieval
- **Tech Hacker**: Matrix-style, neon, cyber
- **Nature Trail**: Forest, mountains, wildlife
- **Art Gallery**: Famous paintings, color puzzles
- **Music Festival**: Instruments, genres, lyrics

## CSS Theme Structure

Create a new visual theme while maintaining functionality:

```css
:root {
    --primary-color: #[your-color];
    --secondary-color: #[your-color];
    --background-gradient: linear-gradient([your-gradient]);
    --text-color: #[your-color];
    --success-color: #[your-color];
    --error-color: #[your-color];
}

/* Basic structure to maintain */
.container { /* Main content wrapper */ }
.clue-content { /* Clue text styling */ }
.word-inputs { /* Multi-word input layout */ }
.message { /* Feedback messages */ }
.hint-container { /* Collapsible hints */ }
```

## Progress Tracking

The hunt uses localStorage with key "hunt2025_progress". Consider:
- Using a different key for your new hunt
- Adding timestamp to track completion time
- Storing additional metadata (attempts, hints used)

## Testing Strategy

1. **Unit Testing**: Test encryption/decryption functions
2. **Flow Testing**: Use test-secure-flow.html to verify mappings
3. **User Testing**: Have someone unfamiliar test the hunt
4. **Cross-browser**: Test on Chrome, Firefox, Safari, mobile

## Security Considerations

- Answers are client-side validated (not truly secure)
- Suitable for fun/educational purposes
- Don't use for sensitive applications
- Consider rate limiting attempts if adding backend

## Next Steps

1. **Design your clues and answers**
2. **Choose a visual theme**
3. **Generate the encrypted mappings**
4. **Create HTML pages following templates**
5. **Style with your chosen theme**
6. **Test thoroughly**
7. **Deploy and share!**

Remember: The goal is to create an engaging, themed experience while maintaining the robust technical architecture from the original treasure hunt.
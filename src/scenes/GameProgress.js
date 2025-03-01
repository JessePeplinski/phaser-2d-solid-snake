// This is a new helper class to manage game progress
export class GameProgress {
    constructor() {
        this.storageKey = 'solidSnek_progress';
        this.data = this.load();
    }

    // Load progress data from localStorage
    load() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (e) {
            console.error('Error loading game progress:', e);
        }
        
        // Default data if none exists
        return {
            completedLevels: ['level1'], // Level 1 is unlocked by default
            highestUnlockedLevel: 1
        };
    }

    // Save progress data to localStorage
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving game progress:', e);
        }
    }

    // Mark a level as completed
    completeLevel(levelKey) {
        // Extract level number
        let levelNumber;
        if (levelKey === 'map') {
            levelNumber = 1;
        } else {
            levelNumber = parseInt(levelKey.replace('level', '')) || 1;
        }

        // Add to completed levels if not already there
        const levelId = `level${levelNumber}`;
        if (!this.data.completedLevels.includes(levelId)) {
            this.data.completedLevels.push(levelId);
        }

        // Unlock next level
        const nextLevelNumber = levelNumber + 1;
        if (nextLevelNumber > this.data.highestUnlockedLevel) {
            this.data.highestUnlockedLevel = nextLevelNumber;
        }

        // Save changes
        this.save();
        
        return `level${nextLevelNumber}`;
    }

    // Check if a level is unlocked
    isLevelUnlocked(levelKey) {
        // Extract level number
        let levelNumber;
        if (levelKey === 'map') {
            levelNumber = 1;
        } else {
            levelNumber = parseInt(levelKey.replace('level', '')) || 0;
        }
        
        return levelNumber <= this.data.highestUnlockedLevel;
    }

    // Get all completed level keys
    getCompletedLevels() {
        return [...this.data.completedLevels];
    }

    // Get highest unlocked level number
    getHighestUnlockedLevel() {
        return this.data.highestUnlockedLevel;
    }

    // Reset all progress (for testing)
    reset() {
        this.data = {
            completedLevels: ['level1'],
            highestUnlockedLevel: 1
        };
        this.save();
    }
}

// Create a singleton instance
export const gameProgress = new GameProgress();
// ResponsiveUI.js - A helper class for responsive UI in Phaser games

export class ResponsiveUI {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.cameras.main.width;
        this.height = scene.cameras.main.height;
        this.isLandscape = this.width > this.height;
        this.isMobile = this.detectMobile();
        
        // Base design width (your reference width for scaling calculations)
        this.baseWidth = 800;
        
        // Calculate adaptive scale factors
        this.updateScaleFactors();
        
        // Listen for resize events
        scene.scale.on('resize', this.handleResize, this);
    }
    
    // Calculate appropriate scale factors based on device and screen size
    updateScaleFactors() {
        // Basic scale factor based on width
        this.scaleFactor = this.width / this.baseWidth;
        
        // Adaptive text scaling with minimum sizes
        if (this.isMobile) {
            // On mobile, use a higher minimum scale for better readability
            this.textScaleFactor = Math.max(this.scaleFactor, 0.7);
            this.buttonScaleFactor = Math.max(this.scaleFactor, 0.8);
        } else {
            // On desktop, we can go a bit smaller but still have minimums
            this.textScaleFactor = Math.max(this.scaleFactor, 0.6);
            this.buttonScaleFactor = Math.max(this.scaleFactor, 0.7);
        }
        
        // Special scaling for very large screens to prevent elements from becoming too large
        const maxScale = 1.5;
        this.textScaleFactor = Math.min(this.textScaleFactor, maxScale);
        this.buttonScaleFactor = Math.min(this.buttonScaleFactor, maxScale);
    }
    
    // Handle window resize events
    handleResize(gameSize) {
        this.width = gameSize.width;
        this.height = gameSize.height;
        this.isLandscape = this.width > this.height;
        this.updateScaleFactors();
    }
    
    // Detect if we're on a mobile device
    detectMobile() {
        return (
            this.scene.sys.game.device.os.android || 
            this.scene.sys.game.device.os.iOS ||
            this.scene.sys.game.device.os.windowsPhone ||
            (this.width < 768) // Also treat small screens as mobile
        );
    }
    
    // Get font size with minimum limit
    fontSize(baseSize) {
        const minSize = this.isMobile ? 16 : 14; // Minimum readable font size
        return Math.max(Math.round(baseSize * this.textScaleFactor), minSize);
    }
    
    // Get scaled button size with minimum touch area
    buttonSize(baseWidth, baseHeight) {
        const minTouchWidth = this.isMobile ? 44 : 32;
        const minTouchHeight = this.isMobile ? 44 : 32;
        
        return {
            width: Math.max(baseWidth * this.buttonScaleFactor, minTouchWidth),
            height: Math.max(baseHeight * this.buttonScaleFactor, minTouchHeight)
        };
    }
    
    // Create responsive text with proper scaling
    createText(x, y, text, style = {}) {
        // Extract base font size or use default
        const baseSize = style.fontSize ? parseInt(style.fontSize) : 16;
        
        // Create new style with scaled font size
        const scaledStyle = {
            ...style,
            fontSize: `${this.fontSize(baseSize)}px`
        };
        
        return this.scene.add.text(x, y, text, scaledStyle);
    }
    
    // Create a responsive button with proper sizing
    createButton(x, y, text, style = {}, callback = null) {
        // Base dimensions if not specified
        const baseWidth = style.width || 200;
        const baseHeight = style.height || 60;
        
        // Calculate scaled dimensions
        const { width, height } = this.buttonSize(baseWidth, baseHeight);
        
        // Extract base font size or use default
        const baseSize = style.fontSize ? parseInt(style.fontSize) : 24;
        
        // Create new style with scaled font size
        const scaledStyle = {
            ...style,
            fontSize: `${this.fontSize(baseSize)}px`,
            padding: {
                left: Math.round(16 * this.buttonScaleFactor),
                right: Math.round(16 * this.buttonScaleFactor),
                top: Math.round(8 * this.buttonScaleFactor),
                bottom: Math.round(8 * this.buttonScaleFactor)
            }
        };
        
        // Create the button
        const button = this.scene.add.text(x, y, text, scaledStyle);
        button.setOrigin(0.5);
        
        // Add interactivity
        if (callback) {
            button.setInteractive({ useHandCursor: true })
                .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
                .on('pointerout', () => button.setStyle({ fill: style.fill || '#ffffff' }))
                .on('pointerdown', callback);
        }
        
        return button;
    }
    
    // Get a layout configuration based on orientation and device
    getLayout() {
        if (this.isLandscape) {
            return this.isMobile ? 'mobileLandscape' : 'desktopLandscape';
        } else {
            return this.isMobile ? 'mobilePortrait' : 'desktopPortrait';
        }
    }
    
    // Calculate safe zone padding (useful for notched phones)
    getSafeZone() {
        const topPadding = this.isMobile ? 40 : 20;
        const bottomPadding = this.isMobile ? 40 : 20;
        const sidePadding = this.isMobile ? 20 : 10;
        
        return {
            top: topPadding,
            bottom: bottomPadding,
            left: sidePadding,
            right: sidePadding
        };
    }
}
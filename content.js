console.log("Email Writer Extension - Content Script Loaded");

// ========== BUTTON CREATION ==========
// Function to create and style the AI reply button with a dropdown.
// Function to create and style the AI reply button with a dropdown.
// Function to create and style the AI reply button with a dropdown.
function createAIButton() {
    // Inject a specific CSS rule to fix styling
    function injectStyles() {
        if (document.getElementById('ai-button-styles')) {
            return; // Styles already injected
        }
        const styleTag = document.createElement('style');
        styleTag.id = 'ai-button-styles';
        styleTag.innerHTML = `
            .ai-reply-arrow {
                width: 30px !important;
                font-size: 15px !important;
                padding: 0 3px !important;
                height: 36px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-top-right-radius: 10px !important;
                border-bottom-right-radius: 10px !important;
                border-top-left-radius: 1px !important;
                border-bottom-left-radius: 1px !important;
                border-left: 1px solid #ccc !important;
            }
        `;
        document.head.appendChild(styleTag);
    }
    
    injectStyles();

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.marginRight = "8px";
    container.style.position = "relative";

    // Main AI Reply button
    const button = document.createElement("div");
    button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3";
    button.style.height = "36px"; // Set explicit height for main button
    button.style.borderTopLeftRadius = "10px";
    button.style.borderBottomLeftRadius = "10px";
    button.style.borderTopRightRadius = "2px";
    button.style.borderBottomRightRadius = "2px";
    button.style.padding = "0 12px";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.whiteSpace = "nowrap";
    button.innerText = "AI Reply";
    button.setAttribute("role", "button");

    // Dropdown arrow button - smaller like Gmail's send button
    const arrow = document.createElement("div");
    arrow.className = "T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-arrow";
    arrow.innerHTML = "&#9662;"; // ▼
    arrow.setAttribute("role", "button");
    
    // Remove any height inheritance and set specific smaller size
    arrow.style.height = "36px"; // Same height but with different styling
    arrow.style.minWidth = "20px"; // Narrow width like Gmail's send button
    arrow.style.padding = "0 4px"; // Minimal padding
    arrow.style.display = "flex";
    arrow.style.alignItems = "center";
    arrow.style.justifyContent = "center";
    arrow.style.fontSize = "12px"; // Smaller font size

    // Dropdown menu
    const dropdown = document.createElement("div");
    dropdown.style.position = "absolute";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
    dropdown.style.background = "white";
    dropdown.style.border = "1px solid #ccc";
    dropdown.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    dropdown.style.display = "none";
    dropdown.style.zIndex = "10000";
    dropdown.style.borderRadius = "6px";
    dropdown.style.minWidth = "180px";
    dropdown.style.fontSize = "14px";

    const options = ["Friendly", "Casual", "Professional", "Custom Tone"];
    options.forEach(opt => {
        const item = document.createElement("div");
        item.innerText = opt;
        item.style.padding = "8px 12px";
        item.style.cursor = "pointer";
        item.addEventListener("mouseover", () => item.style.background = "#f5f5f5");
        item.addEventListener("mouseout", () => item.style.background = "white");

        item.addEventListener("click", () => {
            dropdown.style.display = "none";
            let selectedTone = "professional yet friendly"; // default

            if (opt === "Custom Tone") {
                const userTone = prompt("Enter your own tone:");
                if (userTone && userTone.trim() !== "") {
                    selectedTone = userTone.trim();
                }
            } else if (opt !== "Professional") {
                selectedTone = opt.toLowerCase();
            } else {
                selectedTone = "professional";
            }

            // Call backend with chosen tone
            generateAIReply(selectedTone, button, arrow);
        });

        dropdown.appendChild(item);
    });

    arrow.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevents clicks outside from closing immediately
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    });

    // Main button click = default tone
    button.addEventListener("click", () => {
        dropdown.style.display = "none"; // Hide dropdown on main button click
        generateAIReply("professional yet friendly", button, arrow);
    });

    // Click outside to close the dropdown
    document.addEventListener("click", (event) => {
        if (!container.contains(event.target)) {
            dropdown.style.display = "none";
        }
    });

    container.appendChild(button);
    container.appendChild(arrow);
    container.appendChild(dropdown);

    return container;
}



// ========== FIND COMPOSE TOOLBAR ==========
function findComposeToolbar() {
    const selectors = [".btC", ".aDh", "[role='toolbar']", ".gU.Up"];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}

// ========== INJECT BUTTON ==========
function injectButton() {
    const existingButton = document.querySelector(".ai-reply-container");
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }

    console.log("Toolbar found, creating AI button");
    const buttonContainer = createAIButton();
    buttonContainer.classList.add("ai-reply-container");

    toolbar.insertBefore(buttonContainer, toolbar.firstChild);
}

// ========== GENERATE AI REPLY ==========
function generateAIReply(tone, button, arrow) {
    console.log("Generating AI Reply with tone:", tone);

    button.innerText = "Generating...";
    button.disabled = true;
    arrow.disabled = true;

    const emailContent = getEmailContent();

    fetch("https://email-writer-backend-pefe.onrender.com/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            emailContent: emailContent,
            tone: tone
        })
    })
    .then(response => response.text())
    .then(generatedReply => {
        button.innerText = "AI Reply";
        button.disabled = false;
        arrow.disabled = false;

        const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
        if (composeBox) {
            composeBox.focus();
            document.execCommand("insertText", false, generatedReply);
        } else {
            console.error("Compose box not found");
        }
    })
    .catch(error => {
        console.error("Error generating reply:", error);
        button.innerText = "AI Reply";
        button.disabled = false;
        arrow.disabled = false;
        alert("Failed to generate reply. Try again.");
    });
}

// ========== EMAIL CONTENT EXTRACTION ==========
function getEmailContent() {
    const selectors = [".h7", ".a3s.aiL", ".gmail_quote", "[role='presentation']"];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) return content.innerText.trim();
    }
    return "";
}

// ========== OBSERVER TO WATCH FOR COMPOSE ==========
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches(".aDh, .btC, [role='dialog']") || node.querySelector(".aDh, .btC, [role='dialog']"))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

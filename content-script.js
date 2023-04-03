console.log('ColorGPT Active!');

setTimeout(() => {

    // Function to generate a random string of 8 digits
    function generateRandomId() {
        return Math.floor(Math.random() * 100000000).toString();
    }

    // Function to save color assignment and data-id association
    function saveColorAssignment(conversationId, colorClass, conversationText) {
        // Save the color assignment
        chrome.storage.local.set({ [conversationId]: colorClass }, () => {
            console.log('Color assignment saved:', conversationId, colorClass);
        });

        // Save the data-id and conversation text association only if conversationText is not null
        if (conversationText) {
            chrome.storage.local.set({ [conversationText]: conversationId }, () => {
                console.log('Data-id association saved:', conversationText, conversationId);
            });
        }
    }

    // Function to save pin assignment
    function savePinAssignment(conversationId, isPinned) {
        // Save the pin assignment
        chrome.storage.local.set({ [conversationId + '_pinned']: isPinned }, () => {
            console.log('Pin assignment saved:', conversationId, isPinned);
        });
    }

    // Function to load color assignments, pin assignments, and data-id association
    function loadAssignments(conversationText, callback) {
        chrome.storage.local.get([conversationText], (result) => {
            const conversationId = result[conversationText];
            if (conversationId) {
                chrome.storage.local.get([conversationId, conversationId + '_pinned'], (result) => {
                    const colorClass = result[conversationId];
                    const isPinned = result[conversationId + '_pinned'];
                    callback(conversationId, colorClass, isPinned);
                });
            } else {
                callback(null, null, null);
            }
        });
    }

    // Wrap the main function in an event listener for the DOMContentLoaded event
    function onDomLoaded() {

        let hasClickedNavButton = false; // Initialize a flag variable

        function clickNavButtonUntilGone(interval) {
            // If the function has already been executed, return early
            if (hasClickedNavButton) {
                return;
            }

            document.querySelector('nav').classList.add('loading');

            const clickInterval = setInterval(() => {
                const navButton = document.querySelector('nav > div > div > button');
                if (navButton) {
                    navButton.click();
                } else {
                    setTimeout(() => {
                        document.querySelector('nav').classList.remove('loading');
                        document.querySelector('nav').classList.add('colorgpt-loaded');
                    }, 125);
                    setTimeout(() => {
                        engageUIChanges();
                    }, 250);

                    clearInterval(clickInterval); // Clear the interval when the button no longer exists
                    hasClickedNavButton = true; // Set the flag to true once the function has completed
                }
            }, interval);
        }

        // Function to create and insert the color picker button for each conversation element
        function engageUIChanges() {

            function isMouseHoveredOverNav() {
                // Use the :hover pseudo-class to check if the <nav> element is being hovered
                const navHovered = document.querySelector('nav:hover');

                // If the navHovered variable is not null, it means the mouse is currently hovered over <nav>
                const isHovered = !!navHovered;

                // Return true if the mouse is hovered over <nav>, otherwise return false
                return isHovered;
            }
            // Usage: Call the function to check if the mouse is currently hovered over <nav>
            const mouseHoveredOverNav = isMouseHoveredOverNav();
            if (mouseHoveredOverNav) {
                document.querySelector('body > div > div:nth-of-type(2) > div:nth-of-type(1)').classList.add('nav-hovered');
            }

            function handleNavHover() {
                // Select the <nav> element
                const navElement = document.querySelector('nav');

                // Select the target element that will receive the "nav-hovered" class
                const targetElement = document.querySelector('body > div > div:nth-of-type(2) > div:nth-of-type(1)');

                // Check if both elements exist
                if (navElement && targetElement) {
                    // Add event listener for "mouseenter" event on the <nav> element
                    navElement.addEventListener('mouseenter', () => {
                        // Add "nav-hovered" class to the target element
                        targetElement.classList.add('nav-hovered');
                    });

                    // Add event listener for "mouseleave" event on the <nav> element
                    navElement.addEventListener('mouseleave', () => {
                        // Remove "nav-hovered" class from the target element
                        targetElement.classList.remove('nav-hovered');
                    });
                } else {
                    console.error('Nav element or target element not found');
                }
            }

            // Call the function to set up the event listeners
            handleNavHover();



            // Select all conversation elements using the provided selector
            const conversationElements = document.querySelectorAll('nav > div > div > a');

            // Define an array of color classes for the color option buttons
            const colorClasses = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'black'];

            // Iterate over each conversation element
            conversationElements.forEach(conversationElement => {
                // Add the 'conversation' class to the conversation element
                conversationElement.classList.add('conversation');

                // Get the target element for conversation text
                const textElement = conversationElement.querySelector(':scope > svg + div');

                // Get the conversation text
                const conversationText = textElement ? textElement.textContent : null;

                // Initialize conversationId variable
                let conversationId = conversationElement.getAttribute('data-id');

                // Load the color assignment, pin assignment, and data-id based on the conversation text
                loadAssignments(conversationText, (storedConversationId, colorClass, isPinned) => {
                    if (storedConversationId) {
                        conversationId = storedConversationId; // Update conversationId with the stored value
                        // Apply the data-id to the conversation element
                        conversationElement.setAttribute('data-id', conversationId);
                        // Apply the color class if it exists
                        if (colorClass) {
                            conversationElement.classList.add(colorClass);
                        }
                        // Apply the 'pinned' class if the conversation is pinned
                        if (isPinned) {
                            conversationElement.classList.add('pinned');
                        }
                    } else {
                        // Generate a new data-id if it doesn't exist
                        conversationId = conversationId || generateRandomId();
                        conversationElement.setAttribute('data-id', conversationId);
                    }
                });

                // Select the target element within the conversation element using the relative selector
                const targetElement = conversationElement.querySelector(':scope > svg + div + div');

                // Check if the target element exists
                if (targetElement) {

                    // Check if the color picker container already exists inside the target element
                    const existingColorPickerContainer = targetElement.querySelector('.color-picker-container');
                    if (existingColorPickerContainer) {
                        // If the color picker container already exists, skip the creation and appending process
                        return;
                    }
                    // Create the color picker container
                    const colorPickerContainer = document.createElement('div');
                    colorPickerContainer.className = 'color-picker-container';

                    // Create the button element
                    const colorPickerButton = document.createElement('button');
                    colorPickerButton.className = 'color-picker';

                    // Create the color options container
                    const colorOptionsContainer = document.createElement('div');
                    colorOptionsContainer.className = 'color-options';

                    // Function to remove all color classes from the conversation element
                    const removeColorClasses = () => {
                        colorClasses.forEach(colorClass => {
                            conversationElement.classList.remove(colorClass);
                        });
                    };

                    // Create color option buttons and append them to the color options container
                    colorClasses.forEach(colorClass => {
                        const colorOptionButton = document.createElement('button');
                        colorOptionButton.className = colorClass;
                        colorOptionButton.addEventListener('click', (event) => {
                            // Stop the click event from bubbling up and triggering the document click listener
                            event.stopPropagation();
                            // If the clicked button is .black, remove all color classes from the parent .conversation
                            if (colorClass === 'black') {
                                removeColorClasses();
                                saveColorAssignment(conversationId, null, conversationText); // Remove the color assignment from storage
                            } else {
                                // Remove existing color classes before adding the new one
                                removeColorClasses();
                                // Add the class of the clicked color option button to the parent .conversation element
                                conversationElement.classList.add(colorClass);
                                // Log the values before calling the saveColorAssignment function
                                console.log('Calling saveColorAssignment with values:', conversationId, colorClass, conversationText);
                                saveColorAssignment(conversationId, colorClass, conversationText); // Save the color assignment to storage
                            }
                            // Remove the .active class from the parent .color-picker-container
                            colorPickerContainer.classList.remove('active');
                        });
                        colorOptionsContainer.appendChild(colorOptionButton);
                    });


                    // Check if the .pin-convo button already exists inside the target element
                    const existingPinConvoButton = targetElement.querySelector('.pin-convo');
                    if (!existingPinConvoButton) {
                        // Create the .pin-convo button
                        const pinConvoButton = document.createElement('button');
                        pinConvoButton.className = 'pin-convo';

                        // Create the SVG element for the .pin-convo button
                        const pinConvoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        pinConvoSvg.setAttribute('width', '16');
                        pinConvoSvg.setAttribute('height', '16');
                        pinConvoSvg.setAttribute('viewBox', '0 0 16 16');
                        pinConvoSvg.setAttribute('fill', 'none');

                        // Set the inner HTML of the SVG to the new contents
                        pinConvoSvg.innerHTML = `
                        <g clip-path="url(#clip0_50_5239)">
                        <path d="M9 15.5L0.5 7L1 6L5 5L6.5 4.5L8.5 1.5L10 0.5L11 1L15 5L15.5 6.5L11.5 9.5L10 15L9 15.5Z" fill="#D9D9D9"/>
                        <path d="M9.7343 0.0113027C9.04269 0.0797865 8.41822 0.454745 8.03271 1.03301L6.22069 3.75104C6.08983 3.94733 5.89052 4.08779 5.66166 4.14501L1.13832 5.27585C0.613089 5.40716 0.199086 5.81084 0.0545656 6.3326C-0.0899553 6.85435 0.0573484 7.41351 0.440171 7.79634L8.20366 15.5598C8.5865 15.9427 9.14566 16.09 9.66741 15.9454C10.1892 15.8009 10.5928 15.3869 10.7242 14.8617L11.855 10.3383C11.9122 10.1095 12.0527 9.91016 12.249 9.77931L14.967 7.96728C15.5453 7.58178 15.9202 6.95731 15.9887 6.2657C16.0572 5.5741 15.812 4.88822 15.3205 4.39679L11.6032 0.679456C11.1118 0.188026 10.4259 -0.0571811 9.7343 0.0113027ZM9.86944 1.37611C10.1522 1.34811 10.4325 1.44835 10.6334 1.64924L14.3508 5.36657C14.5516 5.56746 14.6519 5.84784 14.6239 6.13056C14.5959 6.41328 14.4426 6.66855 14.2062 6.82614L11.4882 8.63817C11.008 8.95828 10.6644 9.44585 10.5245 10.0057L9.39362 14.5291C9.38215 14.5749 9.34689 14.6111 9.30131 14.6237C9.25573 14.6364 9.20688 14.6235 9.17344 14.59L1.40996 6.82656C1.37652 6.79312 1.36365 6.74428 1.37628 6.6987C1.3889 6.65312 1.42507 6.61785 1.47095 6.60638L5.9943 5.47553C6.55414 5.33557 7.04172 4.99196 7.36183 4.51181L9.17385 1.79377C9.33145 1.55738 9.58672 1.4041 9.86944 1.37611Z" fill="#C5C5D2"/>
                        <path d="M4.32245 10.7083C4.59024 10.4405 5.02443 10.4405 5.29223 10.7083C5.53568 10.9517 5.55781 11.3327 5.35862 11.6012L5.29223 11.6781L1.17063 15.7997C0.902833 16.0675 0.468646 16.0675 0.200848 15.7997C-0.0426042 15.5562 -0.0647361 15.1753 0.134452 14.9068L0.200848 14.8299L4.32245 10.7083Z" fill="#C5C5D2"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_50_5239">
                        <rect width="16" height="16" fill="white"/>
                        </clipPath>
                        </defs>
                        </svg>`;

                        // Append the SVG element to the .pin-convo button
                        pinConvoButton.appendChild(pinConvoSvg);

                        // Add click event listener to the .pin-convo button
                        pinConvoButton.addEventListener('click', () => {
                            // Toggle the 'pinned' class on the parent .conversation element
                            conversationElement.classList.toggle('pinned');
                            // Determine if the conversation is currently pinned
                            const isPinned = conversationElement.classList.contains('pinned');
                            // Save the pin assignment to storage
                            savePinAssignment(conversationId, isPinned);
                        });

                        // Insert the .pin-convo button right before the .color-picker-container
                        targetElement.insertBefore(pinConvoButton, targetElement.querySelector('.color-picker-container'));
                    }


                    // Add click event listener to the color picker button
                    colorPickerButton.addEventListener('click', (event) => {
                        if (colorPickerButton.closest('.color-picker-container').classList.contains('active')) {
                            colorPickerButton.closest('.color-picker-container').classList.remove('active');
                            return;
                        }
                        // Stop the click event from bubbling up and triggering the document click listener
                        event.stopPropagation();
                        // Remove .active class from all .color-picker-container elements
                        document.querySelectorAll('.color-picker-container.active').forEach(activeContainer => {
                            activeContainer.classList.remove('active');
                        });
                        // Add .active class to the parent .color-picker-container of the clicked button
                        colorPickerContainer.classList.add('active');
                    });

                    // Append the color picker button and color options container to the color picker container
                    colorPickerContainer.appendChild(colorPickerButton);
                    colorPickerContainer.appendChild(colorOptionsContainer);

                    // Append the color picker container to the target element
                    targetElement.appendChild(colorPickerContainer);
                }
            });

            // Add a click event listener to the document to handle clicks outside the .color-picker-container
            document.addEventListener('click', (event) => {
                // Check if the click target is inside any .color-picker-container
                const isClickInsideColorPickerContainer = !!event.target.closest('.color-picker-container');
                // If the click is outside, remove the .active class from all .color-picker-container elements
                if (!isClickInsideColorPickerContainer) {
                    document.querySelectorAll('.color-picker-container.active').forEach(activeContainer => {
                        activeContainer.classList.remove('active');
                    });
                }
            });

            function createFeatureContainer() {

                const existingFeatureContainer = document.querySelector('nav #colorgpt-feature-container');

                if (!existingFeatureContainer) {
                    // Create the colorgpt-feature-container element
                    const featureContainer = document.createElement('div');
                    featureContainer.id = 'colorgpt-feature-container';

                    // Define an array of color classes and search for the buttons
                    const buttonClasses = ['search', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'black'];

                    // Create the buttons and append them to the colorgpt-feature-container
                    buttonClasses.forEach(buttonClass => {
                        const button = document.createElement('button');
                        button.className = buttonClass;
                        button.classList.add('filter-button');
                        // Add any event listeners or attributes to the button here, if needed
                        featureContainer.appendChild(button);
                    });

                    // Create the SVG element using the provided markup
                    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svgElement.setAttribute('width', '18');
                    svgElement.setAttribute('height', '19');
                    svgElement.setAttribute('viewBox', '0 0 18 19');
                    svgElement.setAttribute('fill', 'none');
                    svgElement.innerHTML = `
            <path d="M11.5 10.5L16.707 5.293C16.895 5.105 17 4.851 17 4.586V2C17 1.448 16.552 1 16 1H2C1.448 1 1 1.448 1 2V4.586C1 4.851 1.105 5.106 1.293 5.293L6.5 10.5" stroke="#C5C5D2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 10.5V16.749C6.5 17.562 7.264 18.159 8.053 17.962L10.553 17.337C11.109 17.198 11.5 16.698 11.5 16.124V10.5" stroke="#C5C5D2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            `;

                    // Append the SVG element to the colorgpt-feature-container
                    featureContainer.appendChild(svgElement);

                    // Append the colorgpt-feature-container to the nav element
                    const navElement = document.querySelector('nav');
                    if (navElement) {
                        navElement.appendChild(featureContainer);
                    } else {
                        console.error('Nav element not found');
                    }
                }

            }

            // Call the createFeatureContainer function
            createFeatureContainer();

            // Add event listeners to buttons inside #colorgpt-feature-container
            const featureContainer = document.querySelector('#colorgpt-feature-container');
            if (featureContainer) {
                const colorButtons = featureContainer.querySelectorAll('.filter-button.red, .filter-button.orange, .filter-button.yellow, .filter-button.green, .filter-button.teal, .filter-button.blue, .filter-button.purple, .filter-button.pink, .filter-button.black');
                const navElement = document.querySelector('nav');

                colorButtons.forEach(button => {
                    // Check if the button already has the event listener attached
                    if (button.getAttribute('data-listener-attached') === 'true') {
                        return;
                    }

                    // Mark the button as having the event listener attached
                    button.setAttribute('data-listener-attached', 'true');

                    button.addEventListener('click', () => {
                        // Check if the clicked button initially has the .active class
                        const isActive = button.classList.contains('active');

                        // Remove .active class from all buttons
                        colorButtons.forEach(button => {
                            button.classList.remove('active');
                        });

                        // Remove all .COLOR-active classes from the nav element
                        navElement.classList.remove('red-active', 'orange-active', 'yellow-active', 'green-active', 'teal-active', 'blue-active', 'purple-active', 'pink-active');

                        // If the clicked button did not initially have the .active class, add it
                        if (!isActive) {
                            button.classList.add('active');
                            // Get the color class of the button (e.g., "red")
                            const colorClass = button.className.split(' ')[0];  // Extract only the first part of the class name (the color)
                            navElement.classList.add(`${colorClass}-active`);
                            console.log(colorClass);
                        } else {
                        }
                    });
                });

            }

        }

        // Call the function to add the color picker buttons, the 'conversation' classes,
        // the color picker elements, and button interactions
        engageUIChanges();

        // Call clickNavButtonUntilGone only if the flag is false
        if (!hasClickedNavButton) {
            clickNavButtonUntilGone(500);
        }

        // Set up a mutation observer to detect changes to the #__next element
        const observerConfig = { childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList, observer) => {
            // Disconnect the observer to prevent it from getting stuck in a loop
            observer.disconnect();
            // Re-engage the UI changes if conversation elements are updated
            setTimeout(() => {
                engageUIChanges();
            }, 1000);
            // Reconnect the observer after a delay of 2000ms (2 seconds)
            reconnectObserver(2000);
        });

        // Function to reconnect the observer after a specified delay
        const reconnectObserver = (delay) => {
            setTimeout(() => {
                const targetNode = document.querySelector('#__next');
                if (targetNode) {
                    observer.observe(targetNode, observerConfig);
                } else {
                    console.error('Target node for MutationObserver not found');
                }
            }, delay);
        };

        // Connect the observer for the first time
        const targetNode = document.querySelector('#__next');
        if (targetNode) {
            observer.observe(targetNode, observerConfig);
        } else {
            console.error('Target node for MutationObserver not found');
        }
    }

    // Check if the DOM is already loaded
    if (document.readyState === 'loading') {
        // If the DOM is not yet loaded, add the event listener
        document.addEventListener('DOMContentLoaded', onDomLoaded);
    } else {
        // If the DOM is already loaded, call the function directly
        setTimeout(() => {
            onDomLoaded();
        }, 660);
    }

}, 660);

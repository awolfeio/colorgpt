console.log('ColorGPT Active!');

setTimeout(() => {

    function generateRandomId() {
        return Math.floor(Math.random() * 100000000).toString();
    }

    function saveColorAssignment(conversationId, colorClass, conversationText) {
        chrome.storage.local.set({ [conversationId]: colorClass }, () => {
            console.log('Color assignment saved:', conversationId, colorClass);
        });

        if (conversationText) {
            chrome.storage.local.set({ [conversationText]: conversationId }, () => {
                console.log('Data-id association saved:', conversationText, conversationId);
            });
        }
    }

    function savePinAssignment(conversationId, isPinned) {
        chrome.storage.local.set({ [conversationId + '_pinned']: isPinned }, () => {
            console.log('Pin assignment saved:', conversationId, isPinned);
        });
    }

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

    function movePinnedConversation(conversationElement) {
        const pinnedConversationsContainer = document.querySelector('.pinned-conversations > ol');
        if (pinnedConversationsContainer) {
            conversationElement.previousSiblingReference = conversationElement.previousElementSibling;
            pinnedConversationsContainer.appendChild(conversationElement);
        } else {
            console.error('Pinned conversations container not found');
        }
    }

    function moveUnpinnedConversation(conversationElement) {
        if (conversationElement.previousSiblingReference) {
            conversationElement.previousSiblingReference.insertAdjacentElement('afterend', conversationElement);
        } else {
            const defaultContainer = document.querySelector('nav > .flex-col > div > div > span div:nth-of-type(1) ol');
            if (defaultContainer) {
                defaultContainer.prepend(conversationElement);
                console.log('moved unpinned conversation to defaultContainer');
            } else {
                console.error('Default container for unpinned conversations not found');
            }
        }
    }

    function onDomLoaded() {

        let hasClickedNavButton = false;

        function clickNavButtonUntilGone(interval) {
            if (hasClickedNavButton) {
                return;
            }

            document.querySelector('nav').classList.add('loading');

            const clickInterval = setInterval(() => {
                const navButton = document.querySelector('nav > div > div > .btn-small');
                if (navButton) {
                    setTimeout(() => {
                        navButton.click();
                    }, 150);
                } else {
                    setTimeout(() => {
                        document.querySelector('nav').classList.remove('loading');
                        document.querySelector('nav').classList.add('colorgpt-loaded');
                    }, 125);
                    setTimeout(() => {
                        engageUIChanges();
                    }, 250);

                    clearInterval(clickInterval);
                    hasClickedNavButton = true;
                }
            }, interval);
        }

        function engageUIChanges() {

            function isMouseHoveredOverNav() {

                const navHovered = document.querySelector('nav:hover');

                const isHovered = !!navHovered;

                return isHovered;
            }

            const mouseHoveredOverNav = isMouseHoveredOverNav();
            if (mouseHoveredOverNav) {
                document.querySelector('body > div > div:nth-of-type(2) > div:nth-of-type(1)').classList.add('nav-hovered');
            }

            function handleNavHover() {

                const navElement = document.querySelector('nav');

                const targetElement = document.querySelector('body > div > div:nth-of-type(2) > div:nth-of-type(1)');

                if (navElement && targetElement) {
                    navElement.addEventListener('mouseenter', () => {
                        targetElement.classList.add('nav-hovered');
                    });

                    navElement.addEventListener('mouseleave', () => {
                        targetElement.classList.remove('nav-hovered');
                    });
                } else {
                    console.error('Nav element or target element not found');
                }
            }

            handleNavHover();

            const conversationElements = document.querySelectorAll('nav > .flex-col span > .relative ol li');

            const colorClasses = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'black'];

            const conversationSectionsWrapper = document.querySelector('nav > .flex-col > div > div > span');

            const existingPinnedContainer = document.querySelector('.pinned-conversations');
            if (!existingPinnedContainer) {

                const pinnedConversationsContainer = document.createElement('div');
                pinnedConversationsContainer.className = 'pinned-conversations';
                pinnedConversationsContainer.classList.add('relative');
                const pinnedConversationsInnerWrapper = document.createElement('ol');

                const pinnedConversationsLabel = document.createElement('div');
                pinnedConversationsLabel.textContent = 'Pinned';

                const classNames = 'h-9 pb-2 pt-3 px-3 text-xs text-gray-500 font-medium text-ellipsis overflow-hidden break-all bg-gray-900';
                const classListArray = classNames.split(' ');
                pinnedConversationsLabel.classList.add(...classListArray);

                pinnedConversationsContainer.appendChild(pinnedConversationsLabel);
                pinnedConversationsContainer.appendChild(pinnedConversationsInnerWrapper);
                conversationSectionsWrapper.appendChild(pinnedConversationsContainer);
                
            }


            conversationElements.forEach(conversationElement => {

                conversationElement.classList.add('conversation');

                const textElement = conversationElement.querySelector(':scope > a > svg + div');

                const conversationText = textElement ? textElement.textContent : null;

                let conversationId = conversationElement.getAttribute('data-id');

                loadAssignments(conversationText, (storedConversationId, colorClass, isPinned) => {
                    if (storedConversationId) {
                        conversationId = storedConversationId;

                        conversationElement.setAttribute('data-id', conversationId);

                        if (colorClass) {
                            conversationElement.classList.add(colorClass);
                        }

                        if (isPinned) {
                            conversationElement.classList.add('pinned');
                            movePinnedConversation(conversationElement);
                        }
                    } else {

                        conversationId = conversationId || generateRandomId();
                        conversationElement.setAttribute('data-id', conversationId);
                    }
                });

                const targetElement = conversationElement.querySelector(':scope > a > svg + div + div');

                if (targetElement) {

                    const existingColorPickerContainer = targetElement.querySelector('.color-picker-container');
                    if (existingColorPickerContainer) {

                        return;
                    }

                    const colorPickerContainer = document.createElement('div');
                    colorPickerContainer.className = 'color-picker-container';

                    const colorPickerButton = document.createElement('button');
                    colorPickerButton.className = 'color-picker';

                    const colorOptionsContainer = document.createElement('div');
                    colorOptionsContainer.className = 'color-options';

                    const removeColorClasses = () => {
                        colorClasses.forEach(colorClass => {
                            conversationElement.classList.remove(colorClass);
                        });
                    };

                    colorClasses.forEach(colorClass => {
                        const colorOptionButton = document.createElement('button');
                        colorOptionButton.className = colorClass;
                        colorOptionButton.addEventListener('click', (event) => {

                            event.stopPropagation();

                            if (colorClass === 'black') {
                                removeColorClasses();
                                saveColorAssignment(conversationId, null, conversationText);
                            } else {

                                removeColorClasses();

                                conversationElement.classList.add(colorClass);

                                console.log('Calling saveColorAssignment with values:', conversationId, colorClass, conversationText);
                                saveColorAssignment(conversationId, colorClass, conversationText);
                            }

                            colorPickerContainer.classList.remove('active');
                        });
                        colorOptionsContainer.appendChild(colorOptionButton);
                    });

                    const existingPinConvoButton = targetElement.querySelector('.pin-convo');
                    if (!existingPinConvoButton) {

                        const pinConvoButton = document.createElement('button');
                        pinConvoButton.className = 'pin-convo';

                        const pinConvoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        pinConvoSvg.setAttribute('width', '16');
                        pinConvoSvg.setAttribute('height', '16');
                        pinConvoSvg.setAttribute('viewBox', '0 0 16 16');
                        pinConvoSvg.setAttribute('fill', 'none');

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

                        pinConvoButton.appendChild(pinConvoSvg);

                        pinConvoButton.addEventListener('click', () => {
                            conversationElement.classList.toggle('pinned');
                            const isPinned = conversationElement.classList.contains('pinned');
                            savePinAssignment(conversationId, isPinned);
                            // Move the pinned conversation to the desired container
                            if (isPinned) {
                                movePinnedConversation(conversationElement);
                            } else {
                                moveUnpinnedConversation(conversationElement);
                            }
                        });

                        targetElement.insertBefore(pinConvoButton, targetElement.querySelector('.color-picker-container'));
                    }

                    colorPickerButton.addEventListener('click', (event) => {
                        if (colorPickerButton.closest('.color-picker-container').classList.contains('active')) {
                            colorPickerButton.closest('.color-picker-container').classList.remove('active');
                            return;
                        }

                        event.stopPropagation();

                        document.querySelectorAll('.color-picker-container.active').forEach(activeContainer => {
                            activeContainer.classList.remove('active');
                        });

                        colorPickerContainer.classList.add('active');
                        document.querySelectorAll('.conversation').forEach(conversation => {
                            conversation.classList.remove('color-picker-active');
                        });
                        const conversationParent = colorPickerButton.closest('.conversation');
                        conversationParent.classList.toggle('color-picker-active');
                    });

                    colorPickerContainer.appendChild(colorPickerButton);
                    colorPickerContainer.appendChild(colorOptionsContainer);

                    targetElement.appendChild(colorPickerContainer);
                }
            });

            document.addEventListener('click', (event) => {

                const isClickInsideColorPickerContainer = !!event.target.closest('.color-picker-container');

                if (!isClickInsideColorPickerContainer) {
                    document.querySelectorAll('.color-picker-container.active').forEach(activeContainer => {
                        activeContainer.classList.remove('active');
                    });
                }
            });

            function createFeatureContainer() {

                const existingFeatureContainer = document.querySelector('nav #colorgpt-feature-container');

                if (!existingFeatureContainer) {

                    const featureContainer = document.createElement('div');
                    featureContainer.id = 'colorgpt-feature-container';

                    const buttonClasses = ['search', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'black'];

                    buttonClasses.forEach(buttonClass => {
                        const button = document.createElement('button');
                        button.className = buttonClass;
                        button.classList.add('filter-button');
                        featureContainer.appendChild(button);
                    });

                    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svgElement.setAttribute('width', '18');
                    svgElement.setAttribute('height', '19');
                    svgElement.setAttribute('viewBox', '0 0 18 19');
                    svgElement.setAttribute('fill', 'none');
                    svgElement.innerHTML = `
            <path d="M11.5 10.5L16.707 5.293C16.895 5.105 17 4.851 17 4.586V2C17 1.448 16.552 1 16 1H2C1.448 1 1 1.448 1 2V4.586C1 4.851 1.105 5.106 1.293 5.293L6.5 10.5" stroke="#C5C5D2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 10.5V16.749C6.5 17.562 7.264 18.159 8.053 17.962L10.553 17.337C11.109 17.198 11.5 16.698 11.5 16.124V10.5" stroke="#C5C5D2" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            `;


                    featureContainer.appendChild(svgElement);

                    const navElement = document.querySelector('nav');
                    if (navElement) {
                        navElement.appendChild(featureContainer);
                    } else {
                        console.error('Nav element not found');
                    }
                }

            }

            createFeatureContainer();

            const featureContainer = document.querySelector('#colorgpt-feature-container');
            if (featureContainer) {
                const colorButtons = featureContainer.querySelectorAll('.filter-button.red, .filter-button.orange, .filter-button.yellow, .filter-button.green, .filter-button.teal, .filter-button.blue, .filter-button.purple, .filter-button.pink, .filter-button.black');
                const navElement = document.querySelector('nav');

                colorButtons.forEach(button => {

                    if (button.getAttribute('data-listener-attached') === 'true') {
                        return;
                    }

                    button.setAttribute('data-listener-attached', 'true');

                    button.addEventListener('click', () => {

                        const isActive = button.classList.contains('active');

                        colorButtons.forEach(button => {
                            button.classList.remove('active');
                        });

                        navElement.classList.remove('red-active', 'orange-active', 'yellow-active', 'green-active', 'teal-active', 'blue-active', 'purple-active', 'pink-active');

                        if (!isActive) {
                            button.classList.add('active');
                            const colorClass = button.className.split(' ')[0];
                            navElement.classList.add(`${colorClass}-active`);
                            console.log(colorClass);
                        } else {
                        }
                    });
                });

            }

        }

        engageUIChanges();

        if (!hasClickedNavButton) {
            clickNavButtonUntilGone(850);
        }

        const observerConfig = { childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList, observer) => {
            observer.disconnect();
            setTimeout(() => {
                console.log('Engaging UI Changes via MutationObserver!');
                engageUIChanges();
            }, 750);
            reconnectObserver(1500);
        });

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

        const targetNode = document.querySelector('#__next');
        if (targetNode) {
            observer.observe(targetNode, observerConfig);
        } else {
            console.error('Target node for MutationObserver not found');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDomLoaded);
    } else {
        setTimeout(() => {
            onDomLoaded();
        }, 800);
    }

}, 800);

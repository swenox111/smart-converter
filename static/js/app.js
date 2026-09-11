document.addEventListener("DOMContentLoaded", () => {
    // --- USER ACCOUNTS & ADMIN ENGINE ---
    const DEFAULT_USERS = [
        { username: "antonius2010", password: "Klarinette80", role: "admin", enabled: true }
    ];

    function getUsers() {
        const stored = localStorage.getItem("smart_converter_users");
        if (!stored) {
            localStorage.setItem("smart_converter_users", JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
        try {
            return JSON.parse(stored);
        } catch {
            return DEFAULT_USERS;
        }
    }

    function saveUsers(users) {
        localStorage.setItem("smart_converter_users", JSON.stringify(users));
    }

    const loginScreen = document.getElementById("loginScreen");
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("usernameInput");
    const passwordInput = document.getElementById("passwordInput");
    const loginAlert = document.getElementById("loginAlert");
    const logoutBtn = document.getElementById("logoutBtn");
    const togglePasswordVisibility = document.getElementById("togglePasswordVisibility");
    const adminPanelBtn = document.getElementById("adminPanelBtn");

    function getCurrentUser() {
        const sessionData = sessionStorage.getItem("smart_converter_session_user");
        if (!sessionData) return null;
        try {
            return JSON.parse(sessionData);
        } catch {
            return null;
        }
    }

    function checkAuth() {
        const user = getCurrentUser();
        if (user) {
            loginScreen.classList.add("d-none");
            logoutBtn.style.display = "inline-block";
            
            if (user.role === "admin") {
                adminPanelBtn.classList.remove("d-none");
            } else {
                adminPanelBtn.classList.add("d-none");
            }
        } else {
            loginScreen.classList.remove("d-none");
            logoutBtn.style.display = "none";
            adminPanelBtn.classList.add("d-none");
        }
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const enteredUser = usernameInput.value.trim();
        const enteredPass = passwordInput.value;
        const users = getUsers();

        const match = users.find(u => u.username === enteredUser && u.password === enteredPass && u.enabled);

        if (match) {
            sessionStorage.setItem("smart_converter_session_user", JSON.stringify(match));
            loginAlert.classList.add("d-none");
            checkAuth();
        } else {
            loginAlert.classList.remove("d-none");
        }
    });

    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("smart_converter_session_user");
        passwordInput.value = "";
        checkAuth();
    });

    togglePasswordVisibility.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePasswordVisibility.innerHTML = type === "password" ? '<i class="bi bi-eye-fill"></i>' : '<i class="bi bi-eye-slash-fill"></i>';
    });

    checkAuth();

    // --- ADMIN PANEL CONTROLS ---
    const adminModal = new bootstrap.Modal(document.getElementById('adminModal'));
    const createAccountForm = document.getElementById("createAccountForm");
    const newUsername = document.getElementById("newUsername");
    const newPassword = document.getElementById("newPassword");
    const newRole = document.getElementById("newRole");
    const userTableBody = document.getElementById("userTableBody");
    const userCount = document.getElementById("userCount");

    // Track revealed password indices
    let revealedPasswords = {};

    adminPanelBtn.addEventListener("click", () => {
        revealedPasswords = {};
        renderAdminUserTable();
        adminModal.show();
    });

    function renderAdminUserTable() {
        const users = getUsers();
        userTableBody.innerHTML = "";
        userCount.innerText = users.length;

        users.forEach((u, index) => {
            const tr = document.createElement("tr");
            const isMaster = u.username === "antonius2010";

            let displayPass = "••••••••";
            if (revealedPasswords[index]) {
                displayPass = u.password;
            }

            tr.innerHTML = `
                <td class="fw-bold text-white ps-3">${u.username} ${isMaster ? '<span class="badge bg-primary-blue text-white ms-1 extra-small">Master Admin</span>' : ''}</td>
                <td>
                    <span class="font-monospace text-light me-2" id="passText_${index}">${displayPass}</span>
                    <button class="btn btn-sm btn-link text-secondary p-0" onclick="toggleAdminPasswordView(${index})">
                        <i class="bi ${revealedPasswords[index] ? 'bi-eye-slash-fill text-warning' : 'bi-eye-fill'}"></i>
                    </button>
                </td>
                <td><span class="badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}">${u.role.toUpperCase()}</span></td>
                <td>
                    <span class="badge ${u.enabled ? 'bg-success' : 'bg-danger'}">${u.enabled ? 'Enabled' : 'Disabled'}</span>
                </td>
                <td class="text-end pe-3">
                    ${!isMaster ? `
                        <button class="btn btn-sm ${u.enabled ? 'btn-outline-warning' : 'btn-outline-success'} me-1 rounded-pill" onclick="toggleUserStatus(${index})">
                            ${u.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteUser(${index})"><i class="bi bi-trash"></i></button>
                    ` : '<span class="text-secondary italic extra-small">Protected</span>'}
                </td>
            `;
            userTableBody.appendChild(tr);
        });
    }

    window.toggleAdminPasswordView = (idx) => {
        const users = getUsers();
        const target = users[idx];
        if (!target) return;

        // PRIVACY RULE: Master Admin antonius2010's password cannot be viewed!
        if (target.username === "antonius2010") {
            alert("You don't have access to see this");
            return;
        }

        revealedPasswords[idx] = !revealedPasswords[idx];
        renderAdminUserTable();
    };

    createAccountForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const uname = newUsername.value.trim();
        const pass = newPassword.value.trim();
        const role = newRole.value;

        if (!uname || !pass) return;

        const users = getUsers();
        if (users.some(u => u.username === uname)) {
            alert("Username already exists!");
            return;
        }

        users.push({ username: uname, password: pass, role: role, enabled: true });
        saveUsers(users);
        newUsername.value = "";
        newPassword.value = "";
        renderAdminUserTable();
    });

    window.toggleUserStatus = (idx) => {
        const users = getUsers();
        if (users[idx]) {
            users[idx].enabled = !users[idx].enabled;
            saveUsers(users);
            renderAdminUserTable();
        }
    };

    window.deleteUser = (idx) => {
        const users = getUsers();
        if (users[idx] && confirm(`Are you sure you want to delete user "${users[idx].username}"?`)) {
            users.splice(idx, 1);
            saveUsers(users);
            renderAdminUserTable();
        }
    };

    // --- MULTI-LANGUAGE TRANSLATION ENGINE ---
    const translations = {
        en: {
            lblUsername: "Username",
            lblPassword: "Password",
            btnLoginSubmit: "Sign In",
            lblContactNotice: "If you would like to have access to this, please contact me.",
            loginAlertText: "Invalid username or password.",
            searchPlaceholder: "Search tools...",
            titleSettings: "Settings & Preferences",
            lblLanguage: "Select Language",
            lblAccentColor: "Main Accent Color",
            lblThemeMode: "Theme Mode",
            btnSaveSettings: "Save",
            dropzoneHeader: "Drop file here or select to upload",
            dropzoneSubtext: "Supports PDF, Word, Excel, PPT, Images (PNG/JPG/WEBP), OpenOffice, CSV, ZIP and more.",
            btnSelectFiles: "Choose Files",
            lblSelectedFiles: "Selected Files",
            lblOptions: "Options",
            lblRotationAngle: "Rotation Angle:",
            lblPageNumbers: "Page numbers (e.g. 1, 2, 5):",
            lblCompressLevel: "Compression Level:",
            btnCancel: "Cancel",
            btnConvertNow: "Convert Now",
            gridHeaderTitle: "All PDF Tools",
            btnFilterAll: "All",
            btnFilterConvert: "Convert",
            btnFilterOffice: "Office",
            btnFilterOrganize: "Organize",
            navAppPDF: "PDF Suite",
            desc_compress: "Optimize & reduce PDF size",
            desc_converter: "Convert PDF to any format",
            desc_ocr: "Optical text recognition",
            desc_pdfa: "Convert to archival standard",
            desc_pdf_to_img: "Convert PDF pages into images",
            desc_img_to_pdf: "Convert images to PDF document",
            desc_pdf_to_word: "Convert PDF to editable DOCX",
            desc_pdf_to_excel: "Extract tables to XLSX",
            desc_pdf_to_ppt: "Convert slides to PowerPoint",
            desc_word_to_pdf: "Convert DOCX/DOC to PDF",
            desc_excel_to_pdf: "Render XLSX spreadsheets to PDF",
            desc_ppt_to_pdf: "Convert presentations to PDF",
            desc_openoffice: "Convert ODT, ODS, ODP to PDF",
            desc_txt: "Convert text & tables to PDF",
            desc_zip: "Combine archive into single PDF",
            desc_pages: "Convert iWork Pages documents",
            desc_merge: "Combine multiple PDFs into one",
            desc_split: "Split PDF into individual pages",
            desc_rotate: "Rotate PDF pages freely",
            desc_delete: "Remove unwanted pages",
            desc_extract: "Extract specific pages",
            desc_organize: "Reorder & organize pages"
        },
        de: {
            lblUsername: "Benutzername",
            lblPassword: "Passwort",
            btnLoginSubmit: "Anmelden",
            lblContactNotice: "Falls du Zugang möchtest, kontaktiere mich bitte.",
            loginAlertText: "Benutzername oder Passwort falsch.",
            searchPlaceholder: "Tool suchen...",
            titleSettings: "Einstellungen & Farben",
            lblLanguage: "Sprache auswählen",
            lblAccentColor: "Haupt-Akzentfarbe",
            lblThemeMode: "Design-Modus",
            btnSaveSettings: "Speichern",
            dropzoneHeader: "Datei hierher ziehen oder auswählen",
            dropzoneSubtext: "Unterstützt PDF, Word, Excel, PPT, Bilder (PNG/JPG/WEBP), OpenOffice, CSV, ZIP u.v.m.",
            btnSelectFiles: "Dateien auswählen",
            lblSelectedFiles: "Ausgewählte Dateien",
            lblOptions: "Optionen",
            lblRotationAngle: "Drehwinkel:",
            lblPageNumbers: "Seitenangabe (z.B. 1, 2, 5):",
            lblCompressLevel: "Komprimierungsstufe:",
            btnCancel: "Abbrechen",
            btnConvertNow: "Jetzt Konvertieren",
            gridHeaderTitle: "Alle PDF-Tools",
            btnFilterAll: "Alle",
            btnFilterConvert: "Konvertieren",
            btnFilterOffice: "Office",
            btnFilterOrganize: "Organisieren",
            navAppPDF: "PDF Studio",
            desc_compress: "Dateigröße optimieren & verkleinern",
            desc_converter: "PDF in jedes Format konvertieren",
            desc_ocr: "Texterkennung in gescannten PDFs",
            desc_pdfa: "Archivierungsstandard konvertieren",
            desc_pdf_to_img: "PDF-Seiten in Bilder umwandeln",
            desc_img_to_pdf: "Bilder in PDF-Dokumente bringen",
            desc_pdf_to_word: "PDF in bearbeitbares DOCX umwandeln",
            desc_pdf_to_excel: "Tabellen in XLSX exportieren",
            desc_pdf_to_ppt: "Folien in PowerPoint konvertieren",
            desc_word_to_pdf: "DOCX/DOC in PDF umwandeln",
            desc_excel_to_pdf: "XLSX Tabellenblatt als PDF drucken",
            desc_ppt_to_pdf: "Präsentationen in PDF umwandeln",
            desc_openoffice: "ODT, ODS, ODP in PDF umwandeln",
            desc_txt: "Textdateien & Tabellen in PDF",
            desc_zip: "Archivinhalte in ein PDF zusammenführen",
            desc_pages: "iWork Pages Dokumente umwandeln",
            desc_merge: "Mehrere PDFs zusammenfügen",
            desc_split: "PDF in einzelne Seiten aufteilen",
            desc_rotate: "PDF-Seiten beliebig drehen",
            desc_delete: "Unerwünschte Seiten entfernen",
            desc_extract: "Bestimmte Seiten extrahieren",
            desc_organize: "Seiten neu sortieren & ordnen"
        }
    };

    const languageSelect = document.getElementById("languageSelect");

    function applyLanguage(langKey) {
        const dict = translations[langKey] || translations.en;
        
        Object.keys(dict).forEach(key => {
            const el = document.getElementById(key);
            if (el) {
                if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
                    el.placeholder = dict[key];
                } else {
                    el.innerText = dict[key];
                }
            }
        });

        document.getElementById("searchTools").placeholder = dict.searchPlaceholder || "Search tools...";

        document.querySelectorAll("[data-i18n]").forEach(node => {
            const attrKey = node.getAttribute("data-i18n");
            if (dict[attrKey]) {
                node.innerText = dict[attrKey];
            }
        });

        localStorage.setItem("smart_converter_lang", langKey);
        languageSelect.value = langKey;
    }

    languageSelect.addEventListener("change", (e) => {
        applyLanguage(e.target.value);
    });

    // --- SETTINGS & THEME ENGINE ---
    const openSettingsBtn = document.getElementById("openSettingsBtn");
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    const colorSwatches = document.querySelectorAll(".color-swatch");
    const themeDarkBtn = document.getElementById("themeDark");
    const themeOledBtn = document.getElementById("themeOled");
    const themeLightBtn = document.getElementById("themeLight");

    openSettingsBtn.addEventListener("click", () => {
        settingsModal.show();
    });

    function setAccentColor(colorHex) {
        document.documentElement.style.setProperty('--primary-blue', colorHex);
        
        let hex = colorHex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty('--primary-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
        
        localStorage.setItem("smart_converter_color", colorHex);

        colorSwatches.forEach(swatch => {
            if (swatch.getAttribute("data-color").toLowerCase() === colorHex.toLowerCase()) {
                swatch.classList.add("active");
            } else {
                swatch.classList.remove("active");
            }
        });
    }

    colorSwatches.forEach(swatch => {
        swatch.addEventListener("click", () => {
            const color = swatch.getAttribute("data-color");
            setAccentColor(color);
        });
    });

    function setThemeMode(mode) {
        document.body.classList.remove("theme-dark", "theme-oled", "theme-light");
        document.body.classList.add(`theme-${mode}`);
        localStorage.setItem("smart_converter_theme", mode);

        [themeDarkBtn, themeOledBtn, themeLightBtn].forEach(btn => btn.classList.remove("active"));
        if (mode === "dark") themeDarkBtn.classList.add("active");
        if (mode === "oled") themeOledBtn.classList.add("active");
        if (mode === "light") themeLightBtn.classList.add("active");
    }

    themeDarkBtn.addEventListener("click", () => setThemeMode("dark"));
    themeOledBtn.addEventListener("click", () => setThemeMode("oled"));
    themeLightBtn.addEventListener("click", () => setThemeMode("light"));

    const savedColor = localStorage.getItem("smart_converter_color") || "#0d6efd";
    const savedTheme = localStorage.getItem("smart_converter_theme") || "dark";
    const savedLang = localStorage.getItem("smart_converter_lang") || "en";
    setAccentColor(savedColor);
    setThemeMode(savedTheme);
    applyLanguage(savedLang);

    // --- CONVERTER TOOL ENGINE ---
    let activeTool = "compress_pdf";
    let selectedFiles = [];

    const dropzoneCard = document.getElementById("dropzoneCard");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const fileListContainer = document.getElementById("fileListContainer");
    const fileList = document.getElementById("fileList");
    const fileCount = document.getElementById("fileCount");
    const convertBtn = document.getElementById("convertBtn");
    const clearFilesBtn = document.getElementById("clearFilesBtn");
    const progressBar = document.getElementById("progressBar");
    const selectedToolBadge = document.getElementById("selectedToolBadge");

    const toolOptions = document.getElementById("toolOptions");
    const optionRotate = document.getElementById("optionRotate");
    const optionPages = document.getElementById("optionPages");
    const optionCompress = document.getElementById("optionCompress");

    const toolLabels = {
        "compress_pdf": "Compress PDF",
        "pdf_converter": "PDF Converter",
        "pdf_ocr": "PDF OCR",
        "pdf_to_pdfa": "PDF to PDF/A",
        "pdf_to_jpg": "PDF to JPG / PNG",
        "jpg_to_pdf": "JPG / PNG to PDF",
        "pdf_to_word": "PDF to Word",
        "pdf_to_excel": "PDF to Excel",
        "pdf_to_ppt": "PDF to PPT",
        "word_to_pdf": "Word to PDF",
        "excel_to_pdf": "Excel to PDF",
        "ppt_to_pdf": "PPT to PDF",
        "openoffice_to_pdf": "OpenOffice to PDF",
        "txt_to_pdf": "TXT / HTML / CSV to PDF",
        "zip_to_pdf": "ZIP to PDF",
        "pages_to_pdf": "Pages to PDF",
        "merge_pdf": "Merge PDF",
        "split_pdf": "Split PDF",
        "rotate_pdf": "Rotate PDF",
        "delete_pdf_pages": "Delete PDF Pages",
        "extract_pdf_pages": "Extract PDF Pages",
        "organize_pdf": "Organize PDF"
    };

    function updateToolUI(toolId) {
        activeTool = toolId;
        selectedToolBadge.innerText = `Tool: ${toolLabels[toolId] || toolId}`;

        document.querySelectorAll(".tool-card .card").forEach(card => card.classList.remove("active-card"));
        const activeCard = document.querySelector(`.tool-card[data-tool="${toolId}"] .card`);
        if (activeCard) activeCard.classList.add("active-card");

        optionRotate.classList.add("d-none");
        optionRotate.classList.remove("d-flex");
        optionPages.classList.add("d-none");
        optionCompress.classList.add("d-none");

        let hasOptions = false;
        if (toolId === "rotate_pdf") {
            optionRotate.classList.remove("d-none");
            optionRotate.classList.add("d-flex");
            hasOptions = true;
        } else if (["delete_pdf_pages", "extract_pdf_pages", "organize_pdf"].includes(toolId)) {
            optionPages.classList.remove("d-none");
            hasOptions = true;
        } else if (toolId === "compress_pdf") {
            optionCompress.classList.remove("d-none");
            optionCompress.classList.add("d-flex");
            hasOptions = true;
        }

        if (hasOptions) {
            toolOptions.classList.remove("d-none");
        } else {
            toolOptions.classList.add("d-none");
        }
    }

    document.querySelectorAll(".tool-card").forEach(card => {
        card.addEventListener("click", () => {
            const toolId = card.getAttribute("data-tool");
            updateToolUI(toolId);
            dropzoneCard.scrollIntoView({ behavior: 'smooth' });
        });
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        if (!files.length) return;
        selectedFiles = Array.from(files);
        renderFileList();
    }

    function renderFileList() {
        fileList.innerHTML = '';
        fileCount.innerText = selectedFiles.length;

        selectedFiles.forEach((file, index) => {
            const item = document.createElement("div");
            item.className = "d-flex align-items-center justify-content-between bg-dark p-2 px-3 rounded border border-secondary";
            item.innerHTML = `
                <div class="d-flex align-items-center gap-2 text-truncate">
                    <i class="bi bi-file-earmark-code text-primary"></i>
                    <span class="small text-truncate text-white">${file.name}</span>
                    <span class="badge bg-secondary text-light small">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <button class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="removeFile(${index})"><i class="bi bi-x-circle-fill fs-5"></i></button>
            `;
            fileList.appendChild(item);
        });

        if (selectedFiles.length > 0) {
            dropzone.classList.add("d-none");
            fileListContainer.classList.remove("d-none");
        } else {
            dropzone.classList.remove("d-none");
            fileListContainer.classList.add("d-none");
        }
    }

    window.removeFile = (index) => {
        selectedFiles.splice(index, 1);
        renderFileList();
    };

    clearFilesBtn.addEventListener('click', () => {
        selectedFiles = [];
        fileInput.value = '';
        renderFileList();
    });

    convertBtn.addEventListener('click', async () => {
        if (!selectedFiles.length) {
            alert("Please select at least one file.");
            return;
        }

        const formData = new FormData();
        formData.append("tool_id", activeTool);
        selectedFiles.forEach(file => formData.append("files", file));

        if (activeTool === "rotate_pdf") {
            formData.append("rotation_angle", document.getElementById("rotateAngle").value);
        } else if (["delete_pdf_pages", "extract_pdf_pages", "organize_pdf"].includes(activeTool)) {
            formData.append("page_numbers", document.getElementById("pageNumbers").value);
        } else if (activeTool === "compress_pdf") {
            formData.append("compression_level", document.getElementById("compressLevel").value);
        }

        convertBtn.disabled = true;
        progressBar.classList.remove("d-none");

        try {
            const response = await fetch("/api/convert", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: "Unknown server error" }));
                throw new Error(errData.detail || "Conversion failed.");
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get("content-disposition");
            let fileName = "converted_document";
            if (contentDisposition && contentDisposition.includes("filename=")) {
                fileName = contentDisposition.split("filename=")[1].replace(/"/g, "");
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            alert("Conversion Error: " + err.message);
        } finally {
            convertBtn.disabled = false;
            progressBar.classList.add("d-none");
        }
    });

    document.getElementById("searchTools").addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll(".tool-card").forEach(card => {
            const title = card.innerText.toLowerCase();
            if (title.includes(query)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });

    document.querySelectorAll("#categoryFilter button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#categoryFilter button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filter = btn.getAttribute("data-filter");
            document.querySelectorAll(".tool-card").forEach(card => {
                const category = card.getAttribute("data-category");
                if (filter === "all" || category === filter) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    updateToolUI("compress_pdf");

    // --- SMART DOCS ENGINE (WORD STUDIO) ---
    const docTitleInput = document.getElementById("docTitleInput");
    const editorContent = document.getElementById("editorContent");
    const btnNewDoc = document.getElementById("btnNewDoc");
    const btnTemplates = document.getElementById("btnTemplates");
    const btnExportPdfQuick = document.getElementById("btnExportPdfQuick");
    const docWordCount = document.getElementById("docWordCount");
    const docCharCount = document.getElementById("docCharCount");
    const editorFontFamily = document.getElementById("editorFontFamily");
    const editorFontSize = document.getElementById("editorFontSize");
    const editorHeading = document.getElementById("editorHeading");
    const editorTextColor = document.getElementById("editorTextColor");
    const editorBgColor = document.getElementById("editorBgColor");
    const selectPaperFormat = document.getElementById("selectPaperFormat");
    const selectPaperOrientation = document.getElementById("selectPaperOrientation");

    const templateModalEl = document.getElementById("templateModal");
    const templateModal = templateModalEl ? new bootstrap.Modal(templateModalEl) : null;

    function updateDocCounters() {
        if (!editorContent) return;
        const text = editorContent.innerText || "";
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        if (docWordCount) docWordCount.textContent = words;
        if (docCharCount) docCharCount.textContent = chars;
    }

    if (editorContent) {
        editorContent.addEventListener("input", updateDocCounters);
        editorContent.addEventListener("keyup", updateDocCounters);
    }

    // --- RIBBON TAB SWITCHER ---
    document.querySelectorAll(".ribbon-tab").forEach(tabBtn => {
        tabBtn.addEventListener("click", () => {
            document.querySelectorAll(".ribbon-tab").forEach(b => {
                b.classList.remove("active", "text-light");
                b.classList.add("text-secondary");
            });
            tabBtn.classList.add("active", "text-light");
            tabBtn.classList.remove("text-secondary");

            const targetTabId = tabBtn.getAttribute("data-tab");
            document.querySelectorAll(".ribbon-pane").forEach(pane => {
                pane.classList.add("d-none");
                pane.classList.remove("d-flex");
            });

            const activePane = document.getElementById(targetTabId);
            if (activePane) {
                activePane.classList.remove("d-none");
                activePane.classList.add("d-flex");
            }
        });
    });

    // --- APP SWITCHER ENGINE ---
    const switchAppConverter = document.getElementById("switchAppConverter");
    const switchAppDocs = document.getElementById("switchAppDocs");
    const switchAppPlanner = document.getElementById("switchAppPlanner");
    const converterAppView = document.getElementById("converterAppView");
    const docsAppView = document.getElementById("docsAppView");
    const plannerAppView = document.getElementById("plannerAppView");
    const checkConverter = document.getElementById("checkConverter");
    const checkDocs = document.getElementById("checkDocs");
    const checkPlanner = document.getElementById("checkPlanner");
    const currentAppName = document.getElementById("currentAppName");
    const currentAppIcon = document.getElementById("currentAppIcon");
    const loginAppTitle = document.getElementById("loginAppTitle");
    const loginAppIconContainer = document.getElementById("loginAppIconContainer");

    function setActiveApp(app) {
        if (converterAppView) converterAppView.classList.add("d-none");
        if (docsAppView) docsAppView.classList.add("d-none");
        if (plannerAppView) plannerAppView.classList.add("d-none");

        if (switchAppConverter) switchAppConverter.classList.remove("active", "bg-primary-blue", "text-white");
        if (switchAppDocs) switchAppDocs.classList.remove("active", "bg-primary-blue", "text-white");
        if (switchAppPlanner) switchAppPlanner.classList.remove("active", "bg-primary-blue", "text-white");

        if (checkConverter) checkConverter.classList.add("d-none");
        if (checkDocs) checkDocs.classList.add("d-none");
        if (checkPlanner) checkPlanner.classList.add("d-none");

        if (app === "docs") {
            if (docsAppView) docsAppView.classList.remove("d-none");
            if (switchAppDocs) switchAppDocs.classList.add("active", "bg-primary-blue", "text-white");
            if (checkDocs) checkDocs.classList.remove("d-none");
            if (currentAppName) currentAppName.textContent = "Smart Docs";
            if (currentAppIcon) currentAppIcon.innerHTML = `<div class="blue-icon-circle-sm me-1"><i class="bi bi-file-earmark-text-fill text-white"></i></div>`;
            if (loginAppTitle) loginAppTitle.textContent = "Smart Suite";
            if (loginAppIconContainer) loginAppIconContainer.innerHTML = `<i class="bi bi-layers-fill fs-2 text-white"></i>`;
            updateDocCounters();
        } else if (app === "planner") {
            if (plannerAppView) plannerAppView.classList.remove("d-none");
            if (switchAppPlanner) switchAppPlanner.classList.add("active", "bg-primary-blue", "text-white");
            if (checkPlanner) checkPlanner.classList.remove("d-none");
            if (currentAppName) currentAppName.textContent = "Smart Planner";
            if (currentAppIcon) currentAppIcon.innerHTML = `<div class="blue-icon-circle-sm me-1"><i class="bi bi-calendar3-week-fill text-white"></i></div>`;
            if (loginAppTitle) loginAppTitle.textContent = "Smart Suite";
            if (loginAppIconContainer) loginAppIconContainer.innerHTML = `<i class="bi bi-layers-fill fs-2 text-white"></i>`;
            initPlannerEngine();
        } else {
            if (converterAppView) converterAppView.classList.remove("d-none");
            if (switchAppConverter) switchAppConverter.classList.add("active", "bg-primary-blue", "text-white");
            if (checkConverter) checkConverter.classList.remove("d-none");
            if (currentAppName) currentAppName.textContent = "Smart Converter";
            if (currentAppIcon) currentAppIcon.innerHTML = `<div class="blue-icon-circle-sm me-1"><i class="bi bi-file-earmark-pdf-fill text-white"></i></div>`;
            if (loginAppTitle) loginAppTitle.textContent = "Smart Suite";
            if (loginAppIconContainer) loginAppIconContainer.innerHTML = `<i class="bi bi-layers-fill fs-2 text-white"></i>`;
        }
        sessionStorage.setItem("smart_active_app", app);
    }

    if (switchAppConverter && switchAppDocs) {
        switchAppConverter.addEventListener("click", (e) => {
            e.preventDefault();
            setActiveApp("converter");
        });
        switchAppDocs.addEventListener("click", (e) => {
            e.preventDefault();
            setActiveApp("docs");
        });
        if (switchAppPlanner) {
            switchAppPlanner.addEventListener("click", (e) => {
                e.preventDefault();
                setActiveApp("planner");
            });
        }

        // Restore active app
        const savedApp = sessionStorage.getItem("smart_active_app");
        if (savedApp === "docs") {
            setActiveApp("docs");
        } else if (savedApp === "planner") {
            setActiveApp("planner");
        } else {
            setActiveApp("converter");
        }
    }

    // --- FORMATTING ACTIONS ---
    document.querySelectorAll(".editor-action-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cmd = btn.getAttribute("data-cmd");
            if (cmd) {
                document.execCommand(cmd, false, null);
                if (editorContent) editorContent.focus();
                updateDocCounters();
            }
        });
    });

    if (editorFontFamily) {
        editorFontFamily.addEventListener("change", () => {
            document.execCommand("fontName", false, editorFontFamily.value);
            if (editorContent) editorContent.focus();
        });
    }

    if (editorFontSize) {
        editorFontSize.addEventListener("change", () => {
            document.execCommand("fontSize", false, editorFontSize.value);
            if (editorContent) editorContent.focus();
        });
    }

    if (editorHeading) {
        editorHeading.addEventListener("change", () => {
            const val = editorHeading.value;
            document.execCommand("formatBlock", false, val);
            if (editorContent) editorContent.focus();
        });
    }

    if (editorTextColor) {
        editorTextColor.addEventListener("input", () => {
            document.execCommand("foreColor", false, editorTextColor.value);
            if (editorContent) editorContent.focus();
        });
    }

    if (editorBgColor) {
        editorBgColor.addEventListener("input", () => {
            document.execCommand("hiliteColor", false, editorBgColor.value);
            if (editorContent) editorContent.focus();
        });
    }

    // --- PAPER FORMAT, ORIENTATION & PATTERNS ---
    const selectPaperPattern = document.getElementById("selectPaperPattern");

    if (selectPaperPattern) {
        selectPaperPattern.addEventListener("change", () => {
            const pat = selectPaperPattern.value;
            editorContent.classList.remove("paper-lined", "paper-grid");
            if (pat === "lined") editorContent.classList.add("paper-lined");
            if (pat === "grid") editorContent.classList.add("paper-grid");
        });
    }

    if (selectPaperFormat) {
        selectPaperFormat.addEventListener("change", () => {
            const fmt = selectPaperFormat.value;
            editorContent.classList.remove("format-a5", "format-letter");
            if (fmt === "a5") editorContent.classList.add("format-a5");
            if (fmt === "letter") editorContent.classList.add("format-letter");
        });
    }

    if (selectPaperOrientation) {
        selectPaperOrientation.addEventListener("change", () => {
            const ori = selectPaperOrientation.value;
            if (ori === "landscape") {
                editorContent.classList.add("orientation-landscape");
            } else {
                editorContent.classList.remove("orientation-landscape");
            }
        });
    }

    // --- INSERT TAB ACTIONS ---
    const btnInsertTable = document.getElementById("btnInsertTable");
    const btnInsertHr = document.getElementById("btnInsertHr");
    const btnInsertDate = document.getElementById("btnInsertDate");

    if (btnInsertTable) {
        btnInsertTable.addEventListener("click", () => {
            const tableHTML = `<table class="table table-bordered my-3" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;"><tbody><tr><th style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">Titel 1</th><th style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">Titel 2</th><th style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">Titel 3</th></tr><tr><td style="padding: 8px; border: 1px solid #cbd5e1;">Inhalt 1</td><td style="padding: 8px; border: 1px solid #cbd5e1;">Inhalt 2</td><td style="padding: 8px; border: 1px solid #cbd5e1;">Inhalt 3</td></tr></tbody></table><p></p>`;
            document.execCommand("insertHTML", false, tableHTML);
        });
    }

    if (btnInsertHr) {
        btnInsertHr.addEventListener("click", () => {
            document.execCommand("insertHorizontalRule", false, null);
        });
    }

    if (btnInsertDate) {
        btnInsertDate.addEventListener("click", () => {
            const dateStr = new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            document.execCommand("insertHTML", false, `<span>${dateStr}</span>`);
        });
    }

    // --- TEMPLATES CHOOSER ("MIT VORLAGEN ERSTELLEN") ---
    const TEMPLATES = {
        blank: {
            title: "Unbenanntes Dokument",
            pattern: "blank",
            html: `<h2 class="fw-bold mb-3" style="color: #0f172a; font-family: Calibri, sans-serif;">Leeres Dokument</h2><p style="color: #334155; line-height: 1.7; font-family: Calibri, sans-serif;">Hier den Text eingeben...</p>`
        },
        lined: {
            title: "Liniertes Blatt",
            pattern: "lined",
            html: `<p style="color: #0f172a; font-family: Calibri, sans-serif;">Datum: ${new Date().toLocaleDateString('de-DE')}</p><p></p>`
        },
        grid: {
            title: "Kariertes Blatt",
            pattern: "grid",
            html: `<p style="color: #0f172a; font-family: Calibri, sans-serif;">Mathe / Physik Notizen:</p><p></p>`
        },
        summary: {
            title: "Schul-Zusammenfassung",
            pattern: "blank",
            html: `<h1 class="fw-bold mb-2" style="color: #0f172a; font-family: Calibri, sans-serif;">Zusammenfassung: [Thema / Fach]</h1><p style="color: #64748b; font-style: italic;">Datum: ${new Date().toLocaleDateString('de-DE')}</p><hr><h3 style="color: #2563eb;">1. Wichtige Begriffe & Definitionen</h3><ul><li><strong>Begriff 1:</strong> Erklärung hier...</li><li><strong>Begriff 2:</strong> Erklärung hier...</li></ul><h3 style="color: #2563eb;">2. Hauptpunkte</h3><p>Schreibe hier die wichtigsten Stichpunkte der Lektion...</p>`
        },
        report: {
            title: "Referat & Aufsatz",
            pattern: "blank",
            html: `<div style="text-align: center; padding: 40px 0;"><h1 class="fw-bold" style="color: #0f172a; font-size: 28pt;">Titel des Referats</h1><p style="color: #475569; font-size: 14pt;">Fach: [Fachname] | vorgelegt von: Antonius</p><p style="color: #64748b;">Klasse / Schule | Datum: ${new Date().toLocaleDateString('de-DE')}</p></div><hr style="margin: 40px 0;"><h2 style="color: #0f172a;">1. Einleitung</h2><p>Kurze Hinführung zum Thema...</p><h2 style="color: #0f172a;">2. Hauptteil</h2><p>Ausführliche Darstellung...</p><h2 style="color: #0f172a;">3. Fazit / Zusammenfassung</h2><p>Ergebnis & Ausblick...</p>`
        },
        letter: {
            title: "Formeller Brief",
            pattern: "blank",
            html: `<div style="margin-bottom: 30px;"><p style="margin:0; font-weight:bold;">Antonius Mustermann</p><p style="margin:0;">Musterstraße 1, 12345 Musterstadt</p></div><div style="margin-bottom: 40px;"><p style="margin:0; font-weight:bold;">Empfänger Name / Schule</p><p style="margin:0;">Schulstraße 10, 12345 Musterstadt</p></div><p style="text-align: right; margin-bottom: 30px;">Musterstadt, den ${new Date().toLocaleDateString('de-DE')}</p><h3 style="color: #0f172a; font-weight: bold;">Betreff: Formelles Schreiben</h3><br><p>Sehr geehrte Damen und Herren,</p><p>hiermit wende ich mich bezüglich...</p><br><p>Mit freundlichen Grüßen,</p><br><p style="font-weight: bold;">Antonius</p>`
        },
        resume: {
            title: "Lebenslauf",
            pattern: "blank",
            html: `<div style="border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;"><h1 style="color: #0f172a; margin: 0;">Antonius Mustermann</h1><p style="color: #2563eb; margin: 0; font-weight: bold;">Schüler / Auszubildender</p></div><h3 style="color: #0f172a;">Persönliche Daten</h3><p>Geburtsdatum: 01.01.2010<br>Adresse: Musterstraße 1, 12345 Musterstadt</p><h3 style="color: #0f172a;">Schulausbildung</h3><p><strong>2016 - Heute:</strong> Gymnasium Musterstadt</p><h3 style="color: #0f172a;">Kenntnisse & Stärken</h3><ul><li>Sprachen: Deutsch (Muttersprache), Englisch</li><li>Computer: Word, PDF Converter, HTML</li></ul>`
        }
    };

    if (btnTemplates && templateModal) {
        btnTemplates.addEventListener("click", () => {
            templateModal.show();
        });
    }

    document.querySelectorAll(".template-card").forEach(card => {
        card.addEventListener("click", () => {
            const key = card.getAttribute("data-template");
            const tmpl = TEMPLATES[key] || TEMPLATES.blank;
            if (docTitleInput) docTitleInput.value = tmpl.title;
            if (editorContent) editorContent.innerHTML = tmpl.html;
            
            // Set paper pattern
            if (selectPaperPattern) {
                selectPaperPattern.value = tmpl.pattern || "blank";
                selectPaperPattern.dispatchEvent(new Event("change"));
            }

            updateDocCounters();
            if (templateModal) templateModal.hide();
        });
    });

    // Template Category Filters & Search
    document.querySelectorAll(".tpl-cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tpl-cat-btn").forEach(b => {
                b.classList.remove("active", "btn-outline-primary");
                b.classList.add("btn-outline-secondary", "text-light");
            });
            btn.classList.add("active", "btn-outline-primary");
            btn.classList.remove("btn-outline-secondary", "text-light");

            const cat = btn.getAttribute("data-cat");
            document.querySelectorAll(".tpl-item").forEach(item => {
                const itemCat = item.getAttribute("data-cat");
                if (cat === "all" || itemCat.includes(cat)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });
        });
    });

    const searchTemplates = document.getElementById("searchTemplates");
    if (searchTemplates) {
        searchTemplates.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll(".tpl-item").forEach(item => {
                const text = item.innerText.toLowerCase();
                if (text.includes(q)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });
        });
    }

    if (btnNewDoc) {
        btnNewDoc.addEventListener("click", () => {
            if (docTitleInput) docTitleInput.value = "Unbenanntes Dokument";
            if (editorContent) editorContent.innerHTML = TEMPLATES.blank.html;
            if (selectPaperPattern) {
                selectPaperPattern.value = "blank";
                selectPaperPattern.dispatchEvent(new Event("change"));
            }
            updateDocCounters();
        });
    }

    // --- SAVE MODAL & ZERO-SERVER CLIENT-SIDE DOWNLOADS ---
    const saveOptionsModalEl = document.getElementById("saveOptionsModal");
    const saveOptionsModal = saveOptionsModalEl ? new bootstrap.Modal(saveOptionsModalEl) : null;
    const btnSaveMain = document.getElementById("btnSaveMain");

    if (btnSaveMain && saveOptionsModal) {
        btnSaveMain.addEventListener("click", () => {
            saveOptionsModal.show();
        });
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    const saveAsPdf = document.getElementById("saveAsPdf");
    const saveAsWord = document.getElementById("saveAsWord");
    const saveAsText = document.getElementById("saveAsText");
    const saveAsHtml = document.getElementById("saveAsHtml");

    const exportTXT = document.getElementById("exportTXT");
    const exportHTML = document.getElementById("exportHTML");
    const exportDOCX = document.getElementById("exportDOCX");
    const exportPDF = document.getElementById("exportPDF");

    function executeSavePdf() {
        if (saveOptionsModal) saveOptionsModal.hide();
        const printWindow = window.open('', '_blank');
        const title = docTitleInput ? docTitleInput.value.trim() : "Dokument";
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: Calibri, Arial, sans-serif; padding: 40px; color: #000; background: #fff; line-height: 1.6; }
                    h1, h2, h3 { color: #0f172a; }
                    @page { size: A4; margin: 20mm; }
                </style>
            </head>
            <body>
                <div>${editorContent ? editorContent.innerHTML : ""}</div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    function executeSaveWord() {
        if (saveOptionsModal) saveOptionsModal.hide();
        const title = docTitleInput ? docTitleInput.value.trim() : "dokument";
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + (editorContent ? editorContent.innerHTML : "") + footer;
        const blob = new Blob(['\ufeff' + sourceHTML], { type: 'application/msword' });
        triggerDownload(blob, `${title}.docx`);
    }

    function executeSaveText() {
        if (saveOptionsModal) saveOptionsModal.hide();
        const title = docTitleInput ? docTitleInput.value.trim() : "dokument";
        const text = editorContent ? editorContent.innerText : "";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        triggerDownload(blob, `${title}.txt`);
    }

    function executeSaveHtml() {
        if (saveOptionsModal) saveOptionsModal.hide();
        const title = docTitleInput ? docTitleInput.value.trim() : "dokument";
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Calibri,sans-serif;padding:40px;line-height:1.6;color:#000;background:#fff;}</style></head><body>${editorContent ? editorContent.innerHTML : ""}</body></html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        triggerDownload(blob, `${title}.html`);
    }

    if (saveAsPdf) saveAsPdf.addEventListener("click", () => {
        if (saveOptionsModal) saveOptionsModal.hide();
        const element = document.getElementById("editorContent");
        const title = docTitleInput ? docTitleInput.value.trim() : "Dokument";
        if (window.html2pdf && element) {
            const opt = {
                margin: 0.4,
                filename: `${title}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        } else {
            executeSavePdf();
        }
    });
    if (saveAsWord) saveAsWord.addEventListener("click", executeSaveWord);
    if (saveAsText) saveAsText.addEventListener("click", executeSaveText);
    if (saveAsHtml) saveAsHtml.addEventListener("click", executeSaveHtml);

    if (exportPDF) exportPDF.addEventListener("click", () => {
        const element = document.getElementById("editorContent");
        const title = docTitleInput ? docTitleInput.value.trim() : "Dokument";
        if (window.html2pdf && element) {
            const opt = {
                margin: 0.4,
                filename: `${title}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        } else {
            executeSavePdf();
        }
    });
    if (exportDOCX) exportDOCX.addEventListener("click", executeSaveWord);
    if (exportTXT) exportTXT.addEventListener("click", executeSaveText);
    if (exportHTML) exportHTML.addEventListener("click", executeSaveHtml);

    // --- SMART PLANNER ENGINE (STUNDENPLAN & NOTENRECHNER) ---
    const DEFAULT_SUBJECTS = [
        { name: "Mathe", color: "#2563eb", text: "#ffffff" },
        { name: "Deutsch", color: "#dc2626", text: "#ffffff" },
        { name: "Englisch", color: "#16a34a", text: "#ffffff" },
        { name: "Physik", color: "#0284c7", text: "#ffffff" },
        { name: "Biologie", color: "#059669", text: "#ffffff" },
        { name: "Chemie", color: "#7c3aed", text: "#ffffff" },
        { name: "Geschichte", color: "#d97706", text: "#ffffff" },
        { name: "Erdkunde", color: "#ca8a04", text: "#ffffff" },
        { name: "Sport", color: "#ea580c", text: "#ffffff" },
        { name: "Kunst", color: "#db2777", text: "#ffffff" },
        { name: "Musik", color: "#9333ea", text: "#ffffff" },
        { name: "Informatik", color: "#0891b2", text: "#ffffff" },
        { name: "Religion", color: "#4b5563", text: "#ffffff" },
        { name: "Frei / Pause", color: "#e2e8f0", text: "#0f172a" }
    ];

    const DEFAULT_LESSON_TIMES = [
        { period: "1. Stunde", time: "08:00 - 08:45 Uhr" },
        { period: "2. Stunde", time: "08:50 - 09:35 Uhr" },
        { period: "3. Stunde", time: "09:55 - 10:40 Uhr" },
        { period: "4. Stunde", time: "10:45 - 11:30 Uhr" },
        { period: "5. Stunde", time: "11:45 - 12:30 Uhr" },
        { period: "6. Stunde", time: "12:35 - 13:20 Uhr" },
        { period: "7. Stunde", time: "13:25 - 14:10 Uhr" },
        { period: "8. Stunde", time: "14:10 - 14:55 Uhr" },
        { period: "9. Stunde", time: "14:55 - 15:40 Uhr" },
        { period: "10. Stunde", time: "15:45 - 16:30 Uhr" }
    ];

    let activeSubject = DEFAULT_SUBJECTS[0];
    let plannerSubjects = [...DEFAULT_SUBJECTS];
    let lessonTimes = JSON.parse(JSON.stringify(DEFAULT_LESSON_TIMES));
    let timetableData = {}; // key: "row_col", val: subjectObj
    let gradeData = []; // list of { subject, written, oral, weight }

    function getPlannerStorageKey() {
        const user = getCurrentUser();
        return user ? `smart_planner_data_${user.username}` : `smart_planner_data_guest`;
    }

    function savePlannerState() {
        const key = getPlannerStorageKey();
        const studentName = document.getElementById("plannerStudentName")?.value || "";
        const studentClass = document.getElementById("plannerClass")?.value || "";
        const studentYear = document.getElementById("plannerYear")?.value || "";
        const theme = document.getElementById("plannerThemeSelect")?.value || "printer";

        const state = {
            studentName,
            studentClass,
            studentYear,
            theme,
            subjects: plannerSubjects,
            lessonTimes: lessonTimes,
            timetable: timetableData,
            grades: gradeData
        };

        localStorage.setItem(key, JSON.stringify(state));
        updatePlannerDisplay();
    }

    function loadPlannerState() {
        const key = getPlannerStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.studentName !== undefined && document.getElementById("plannerStudentName")) {
                    document.getElementById("plannerStudentName").value = parsed.studentName;
                }
                if (parsed.studentClass !== undefined && document.getElementById("plannerClass")) {
                    document.getElementById("plannerClass").value = parsed.studentClass;
                }
                if (parsed.studentYear !== undefined && document.getElementById("plannerYear")) {
                    document.getElementById("plannerYear").value = parsed.studentYear;
                }
                if (parsed.theme && document.getElementById("plannerThemeSelect")) {
                    document.getElementById("plannerThemeSelect").value = parsed.theme;
                }
                if (parsed.subjects && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
                    plannerSubjects = parsed.subjects;
                }
                if (parsed.lessonTimes && Array.isArray(parsed.lessonTimes) && parsed.lessonTimes.length === 10) {
                    lessonTimes = parsed.lessonTimes;
                } else {
                    lessonTimes = JSON.parse(JSON.stringify(DEFAULT_LESSON_TIMES));
                }
                if (parsed.timetable && typeof parsed.timetable === "object") {
                    timetableData = parsed.timetable;
                }
                if (parsed.grades && Array.isArray(parsed.grades)) {
                    gradeData = parsed.grades;
                }
            } catch (e) {
                console.error("Error loading planner state", e);
                lessonTimes = JSON.parse(JSON.stringify(DEFAULT_LESSON_TIMES));
            }
        }
        if (!lessonTimes || !Array.isArray(lessonTimes) || lessonTimes.length !== 10) {
            lessonTimes = JSON.parse(JSON.stringify(DEFAULT_LESSON_TIMES));
        }
        if (!plannerSubjects || !Array.isArray(plannerSubjects) || plannerSubjects.length === 0) {
            plannerSubjects = [...DEFAULT_SUBJECTS];
        }
        if (!activeSubject) {
            activeSubject = plannerSubjects[0];
        }
    }

    function updatePlannerDisplay() {
        const studentName = document.getElementById("plannerStudentName")?.value || "Antonius";
        const studentClass = document.getElementById("plannerClass")?.value || "Klasse 10b";
        const studentYear = document.getElementById("plannerYear")?.value || "2026/2027";
        const displayInfo = document.getElementById("displayStudentInfo");
        if (displayInfo) {
            displayInfo.textContent = `Schüler: ${studentName} • ${studentClass} • Schuljahr ${studentYear}`;
        }
    }

    function renderSubjectPalette() {
        const container = document.getElementById("subjectPaletteContainer");
        const headerIcon = document.getElementById("plannerHeaderIconCircle");
        const headerBadge = document.getElementById("plannerHeaderBadge");
        const theme = document.getElementById("plannerThemeSelect")?.value || "printer";

        if (headerIcon && activeSubject) {
            headerIcon.style.backgroundColor = theme === "printer" ? "#000000" : activeSubject.color;
        }
        if (headerBadge && activeSubject) {
            headerBadge.style.backgroundColor = theme === "printer" ? "#000000" : activeSubject.color;
            headerBadge.style.color = "#ffffff";
        }

        if (!container) return;
        container.innerHTML = "";

        plannerSubjects.forEach((sub, idx) => {
            const badge = document.createElement("span");
            badge.className = `badge rounded-pill px-3 py-2 fs-6 subject-pill ${activeSubject.name === sub.name ? 'active-subject' : ''}`;
            badge.style.backgroundColor = sub.color;
            badge.style.color = sub.text || "#ffffff";
            badge.innerHTML = `<i class="bi bi-book-fill me-1"></i>${sub.name}`;
            badge.addEventListener("click", () => {
                activeSubject = sub;
                renderSubjectPalette();
                renderTimetableGrid();
            });
            container.appendChild(badge);
        });
    }

    function renderTimetableGrid() {
        const tbody = document.getElementById("timetableGridBody");
        if (!tbody) return;
        tbody.innerHTML = "";
        const theme = document.getElementById("plannerThemeSelect")?.value || "printer";

        lessonTimes.forEach((lt, rIdx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<th class="bg-light text-dark align-middle fw-bold small"><div class="fw-bold text-nowrap">${lt.period}</div><div class="extra-small text-muted text-nowrap">${lt.time}</div></th>`;

            for (let cIdx = 0; cIdx < 5; cIdx++) {
                const cellKey = `${rIdx}_${cIdx}`;
                const assigned = timetableData[cellKey];
                const td = document.createElement("td");
                td.className = "tt-cell text-center align-middle";

                const updateCellDOM = (cellData) => {
                    if (cellData) {
                        const len = cellData.name.length;
                        const fontSz = len > 18 ? "0.66rem" : (len > 12 ? "0.74rem" : "0.82rem");

                        if (theme === "printer") {
                            td.style.backgroundColor = "#ffffff";
                            td.style.color = "#000000";
                            td.innerHTML = `<span style="color: #000000; font-weight: 700; font-size: ${fontSz}; line-height: 1.15;">${cellData.name}</span>`;
                        } else {
                            td.style.backgroundColor = cellData.color;
                            td.style.color = cellData.text || "#ffffff";
                            td.innerHTML = `<span style="color: ${cellData.text || '#ffffff'}; font-weight: 700; font-size: ${fontSz}; line-height: 1.15;">${cellData.name}</span>`;
                        }
                    } else {
                        td.style.backgroundColor = "";
                        td.style.color = "";
                        td.innerHTML = `<span class="text-muted opacity-25 small">+</span>`;
                    }
                };

                updateCellDOM(assigned);

                td.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (timetableData[cellKey] && timetableData[cellKey].name === activeSubject.name) {
                        delete timetableData[cellKey];
                        updateCellDOM(null);
                    } else {
                        timetableData[cellKey] = activeSubject;
                        updateCellDOM(activeSubject);
                    }
                    savePlannerState();
                });

                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        });
    }

    function convertToGermanGrade(val) {
        if (val === null || val === undefined || isNaN(val) || val <= 0) return "-";
        const n = parseFloat(val);
        if (n <= 1.15) return "1+";
        if (n <= 1.35) return "1";
        if (n <= 1.65) return "1-";
        if (n <= 1.85) return "2+";
        if (n <= 2.35) return "2";
        if (n <= 2.65) return "2-";
        if (n <= 2.85) return "3+";
        if (n <= 3.35) return "3";
        if (n <= 3.65) return "3-";
        if (n <= 3.85) return "4+";
        if (n <= 4.35) return "4";
        if (n <= 4.65) return "4-";
        if (n <= 4.85) return "5+";
        if (n <= 5.35) return "5";
        if (n <= 5.65) return "5-";
        return "6";
    }

    function renderGradeTable() {
        const tbody = document.getElementById("gradeTableBody");
        const printBody = document.getElementById("notenPrintGridBody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (printBody) printBody.innerHTML = "";

        if (gradeData.length === 0) {
            gradeData = [
                { subject: "Mathematik", written: "2, 1", oral: "2", weight: "50" },
                { subject: "Deutsch", written: "1, 2", oral: "1", weight: "50" },
                { subject: "Englisch", written: "2", oral: "1", weight: "50" }
            ];
        }

        let totalPoints = 0;
        let validSubjects = 0;
        let bestGrade = 6.0;

        const studentName = document.getElementById("plannerStudentName")?.value || "Antonius";
        const studentClass = document.getElementById("plannerClass")?.value || "Klasse 10b";
        const studentYear = document.getElementById("plannerYear")?.value || "2026/2027";
        const displayNotenInfo = document.getElementById("displayNotenStudentInfo");
        if (displayNotenInfo) {
            displayNotenInfo.textContent = `Schüler: ${studentName} • ${studentClass} • Schuljahr ${studentYear}`;
        }

        gradeData.forEach((row, idx) => {
            const tr = document.createElement("tr");

            const parseGrades = (str) => {
                if (!str) return [];
                return str.split(/[,;\s]+/).map(g => parseFloat(g.replace("-", ".25").replace("+", ".75"))).filter(n => !isNaN(n) && n >= 1 && n <= 6);
            };

            const wGrades = parseGrades(row.written);
            const oGrades = parseGrades(row.oral);

            const wAvg = wGrades.length ? wGrades.reduce((a, b) => a + b, 0) / wGrades.length : null;
            const oAvg = oGrades.length ? oGrades.reduce((a, b) => a + b, 0) / oGrades.length : null;

            let finalSubGrade = "-";
            let finalGermanGrade = "-";
            let subNum = 0;

            const wWeight = parseFloat(row.weight) / 100 || 0.5;
            const oWeight = 1 - wWeight;

            if (wAvg !== null && oAvg !== null) {
                subNum = (wAvg * wWeight) + (oAvg * oWeight);
            } else if (wAvg !== null) {
                subNum = wAvg;
            } else if (oAvg !== null) {
                subNum = oAvg;
            }

            if (subNum > 0) {
                finalSubGrade = subNum.toFixed(2);
                finalGermanGrade = convertToGermanGrade(subNum);
                totalPoints += subNum;
                validSubjects++;
                if (subNum < bestGrade) bestGrade = subNum;
            }

            tr.innerHTML = `
                <td class="ps-3 py-2"><input type="text" class="form-control form-control-sm dark-input text-light py-1 grade-sub-input" data-idx="${idx}" value="${row.subject}"></td>
                <td class="py-2"><input type="text" class="form-control form-control-sm dark-input text-light py-1 grade-w-input" data-idx="${idx}" placeholder="z.B. 1, 2-" value="${row.written}"></td>
                <td class="py-2"><input type="text" class="form-control form-control-sm dark-input text-light py-1 grade-o-input" data-idx="${idx}" placeholder="z.B. 1+" value="${row.oral}"></td>
                <td class="py-2">
                    <select class="form-select form-select-sm dark-input text-light py-1 grade-wt-input" data-idx="${idx}">
                        <option value="50" ${row.weight === "50" ? "selected" : ""}>50% / 50%</option>
                        <option value="60" ${row.weight === "60" ? "selected" : ""}>60% / 40%</option>
                        <option value="70" ${row.weight === "70" ? "selected" : ""}>70% / 30%</option>
                    </select>
                </td>
                <td class="py-2 text-center">
                    <span class="badge bg-primary-blue fs-6 px-3 py-1 fw-bold">${finalGermanGrade}</span>
                    ${finalSubGrade !== "-" ? `<div class="extra-small text-secondary mt-1">(${finalSubGrade})</div>` : ''}
                </td>
                <td class="text-end pe-3 py-2">
                    <button class="btn btn-sm btn-outline-danger rounded-circle p-1" onclick="deleteGradeRow(${idx})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);

            if (printBody) {
                const printTr = document.createElement("tr");
                printTr.innerHTML = `
                    <td class="fw-bold text-start ps-3 py-2">${row.subject}</td>
                    <td class="py-2">${row.written || "-"}</td>
                    <td class="py-2">${row.oral || "-"}</td>
                    <td class="py-2">${row.weight}% / ${100 - parseFloat(row.weight || 50)}%</td>
                    <td class="fw-bold fs-6 py-2">${finalGermanGrade} ${finalSubGrade !== "-" ? `(${finalSubGrade})` : ""}</td>
                `;
                printBody.appendChild(printTr);
            }
        });

        document.querySelectorAll(".grade-sub-input").forEach(inp => {
            inp.addEventListener("change", (e) => {
                const idx = e.target.getAttribute("data-idx");
                gradeData[idx].subject = e.target.value;
                savePlannerState();
                renderGradeTable();
            });
        });
        document.querySelectorAll(".grade-w-input").forEach(inp => {
            inp.addEventListener("change", (e) => {
                const idx = e.target.getAttribute("data-idx");
                gradeData[idx].written = e.target.value;
                savePlannerState();
                renderGradeTable();
            });
        });
        document.querySelectorAll(".grade-o-input").forEach(inp => {
            inp.addEventListener("change", (e) => {
                const idx = e.target.getAttribute("data-idx");
                gradeData[idx].oral = e.target.value;
                savePlannerState();
                renderGradeTable();
            });
        });
        document.querySelectorAll(".grade-wt-input").forEach(inp => {
            inp.addEventListener("change", (e) => {
                const idx = e.target.getAttribute("data-idx");
                gradeData[idx].weight = e.target.value;
                savePlannerState();
                renderGradeTable();
            });
        });

        const displayOverallAverage = document.getElementById("displayOverallAverage");
        const displayGpaLabel = document.getElementById("displayGpaLabel");
        const countGradedSubjects = document.getElementById("countGradedSubjects");
        const bestSubjectGrade = document.getElementById("bestSubjectGrade");
        const printOverallGpa = document.getElementById("printOverallGpa");
        const printGpaLabel = document.getElementById("printGpaLabel");

        if (validSubjects > 0) {
            const overallGpa = (totalPoints / validSubjects).toFixed(2);
            const overallGermanGrade = convertToGermanGrade(overallGpa);
            if (displayOverallAverage) displayOverallAverage.textContent = `${overallGermanGrade} (${overallGpa})`;
            if (printOverallGpa) printOverallGpa.textContent = `${overallGermanGrade} (${overallGpa})`;
            if (countGradedSubjects) countGradedSubjects.textContent = validSubjects;
            if (bestSubjectGrade) bestSubjectGrade.textContent = bestGrade < 6.0 ? `${convertToGermanGrade(bestGrade)} (${bestGrade.toFixed(2)})` : "-";

            let label = "Gut";
            let bgClass = "bg-primary";
            const numGpa = parseFloat(overallGpa);
            if (numGpa <= 1.5) { label = "Sehr gut ⭐"; bgClass = "bg-success"; }
            else if (numGpa <= 2.5) { label = "Gut 👍"; bgClass = "bg-primary"; }
            else if (numGpa <= 3.5) { label = "Befriedigend 👌"; bgClass = "bg-info text-dark"; }
            else if (numGpa <= 4.0) { label = "Ausreichend ⚠️"; bgClass = "bg-warning text-dark"; }
            else { label = "Mangelhaft ❌"; bgClass = "bg-danger"; }

            if (displayGpaLabel) {
                displayGpaLabel.textContent = label;
                displayGpaLabel.className = `badge ${bgClass} fs-6 rounded-pill px-3 py-2`;
            }
            if (printGpaLabel) {
                printGpaLabel.textContent = label;
                printGpaLabel.className = `badge ${bgClass} fs-6 rounded-pill px-3 py-2`;
            }
        } else {
            if (displayOverallAverage) displayOverallAverage.textContent = "1.0";
            if (printOverallGpa) printOverallGpa.textContent = "1.0";
            if (countGradedSubjects) countGradedSubjects.textContent = "0";
            if (bestSubjectGrade) bestSubjectGrade.textContent = "-";
        }
    }

    window.deleteGradeRow = (idx) => {
        gradeData.splice(idx, 1);
        savePlannerState();
        renderGradeTable();
    };

    const btnAddGradeRow = document.getElementById("btnAddGradeRow");
    if (btnAddGradeRow) {
        btnAddGradeRow.addEventListener("click", () => {
            gradeData.push({ subject: "Neues Fach", written: "", oral: "", weight: "50" });
            savePlannerState();
            renderGradeTable();
        });
    }

    // Lesson Times Modal Controls
    const btnEditTimesModal = document.getElementById("btnEditTimesModal");
    const btnSaveTimes = document.getElementById("btnSaveTimes");
    const btnRestoreDefaultTimes = document.getElementById("btnRestoreDefaultTimes");
    const timesInputContainer = document.getElementById("timesInputContainer");

    function renderTimesInputs() {
        if (!timesInputContainer) return;
        timesInputContainer.innerHTML = "";

        lessonTimes.forEach((lt, idx) => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6";
            col.innerHTML = `
                <div class="card main-login-card p-2 border-secondary border-opacity-25">
                    <div class="row g-2 align-items-center">
                        <div class="col-5">
                            <input type="text" class="form-control form-control-sm dark-input text-light time-period-input" data-idx="${idx}" value="${lt.period}">
                        </div>
                        <div class="col-7">
                            <input type="text" class="form-control form-control-sm dark-input text-light time-value-input" data-idx="${idx}" value="${lt.time}">
                        </div>
                    </div>
                </div>
            `;
            timesInputContainer.appendChild(col);
        });
    }

    if (btnEditTimesModal) {
        btnEditTimesModal.addEventListener("click", () => {
            renderTimesInputs();
            const modalEl = document.getElementById("timesModal");
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        });
    }

    if (btnSaveTimes) {
        btnSaveTimes.addEventListener("click", () => {
            document.querySelectorAll(".time-period-input").forEach(inp => {
                const idx = inp.getAttribute("data-idx");
                lessonTimes[idx].period = inp.value.trim() || `${parseInt(idx) + 1}. Stunde`;
            });
            document.querySelectorAll(".time-value-input").forEach(inp => {
                const idx = inp.getAttribute("data-idx");
                lessonTimes[idx].time = inp.value.trim();
            });
            savePlannerState();
            renderTimetableGrid();
        });
    }

    if (btnRestoreDefaultTimes) {
        btnRestoreDefaultTimes.addEventListener("click", () => {
            lessonTimes = JSON.parse(JSON.stringify(DEFAULT_LESSON_TIMES));
            renderTimesInputs();
            savePlannerState();
            renderTimetableGrid();
        });
    }

    function initPlannerEngine() {
        loadPlannerState();
        renderSubjectPalette();
        renderTimetableGrid();
        renderGradeTable();

        const studentName = document.getElementById("plannerStudentName");
        const studentClass = document.getElementById("plannerClass");
        const studentYear = document.getElementById("plannerYear");
        const themeSelect = document.getElementById("plannerThemeSelect");

        if (studentName) studentName.addEventListener("input", savePlannerState);
        if (studentClass) studentClass.addEventListener("input", savePlannerState);
        if (studentYear) studentYear.addEventListener("input", savePlannerState);

        if (themeSelect) {
            // Apply initial theme
            const canvas = document.getElementById("plannerPrintCanvas");
            if (canvas) {
                canvas.classList.remove("theme-planner-classic", "theme-planner-midnight", "theme-planner-pastel", "theme-planner-neon", "theme-planner-printer");
                canvas.classList.add(`theme-planner-${themeSelect.value || "printer"}`);
            }

            themeSelect.addEventListener("change", () => {
                if (canvas) {
                    canvas.classList.remove("theme-planner-classic", "theme-planner-midnight", "theme-planner-pastel", "theme-planner-neon", "theme-planner-printer");
                    canvas.classList.add(`theme-planner-${themeSelect.value}`);
                }
                savePlannerState();
            });
        }
    }

    const tabStundenplan = document.getElementById("tabStundenplan");
    const tabNotenrechner = document.getElementById("tabNotenrechner");
    const stundenplanSection = document.getElementById("stundenplanSection");
    const notenrechnerSection = document.getElementById("notenrechnerSection");

    const plannerThemeSelect = document.getElementById("plannerThemeSelect");
    const btnPrintPlanner = document.getElementById("btnPrintPlanner");
    const btnSavePlannerPdf = document.getElementById("btnSavePlannerPdf");
    const btnResetPlanner = document.getElementById("btnResetPlanner");
    const btnPrintNoten = document.getElementById("btnPrintNoten");
    const btnSaveNotenPdf = document.getElementById("btnSaveNotenPdf");

    if (tabStundenplan && tabNotenrechner) {
        tabStundenplan.addEventListener("click", () => {
            tabStundenplan.classList.add("btn-primary-blue");
            tabStundenplan.classList.remove("btn-outline-secondary", "text-light");
            tabNotenrechner.classList.remove("btn-primary-blue");
            tabNotenrechner.classList.add("btn-outline-secondary", "text-light");
            if (stundenplanSection) stundenplanSection.classList.remove("d-none");
            if (notenrechnerSection) notenrechnerSection.classList.add("d-none");

            if (plannerThemeSelect) plannerThemeSelect.classList.remove("d-none");
            if (btnEditTimesModal) btnEditTimesModal.classList.remove("d-none");
            if (btnPrintPlanner) btnPrintPlanner.classList.remove("d-none");
            if (btnSavePlannerPdf) btnSavePlannerPdf.classList.remove("d-none");
            if (btnResetPlanner) btnResetPlanner.classList.remove("d-none");

            if (btnPrintNoten) btnPrintNoten.classList.add("d-none");
            if (btnSaveNotenPdf) btnSaveNotenPdf.classList.add("d-none");
        });

        tabNotenrechner.addEventListener("click", () => {
            tabNotenrechner.classList.add("btn-primary-blue");
            tabNotenrechner.classList.remove("btn-outline-secondary", "text-light");
            tabStundenplan.classList.remove("btn-primary-blue");
            tabStundenplan.classList.add("btn-outline-secondary", "text-light");
            if (notenrechnerSection) notenrechnerSection.classList.remove("d-none");
            if (stundenplanSection) stundenplanSection.classList.add("d-none");

            if (plannerThemeSelect) plannerThemeSelect.classList.add("d-none");
            if (btnEditTimesModal) btnEditTimesModal.classList.add("d-none");
            if (btnPrintPlanner) btnPrintPlanner.classList.add("d-none");
            if (btnSavePlannerPdf) btnSavePlannerPdf.classList.add("d-none");
            if (btnResetPlanner) btnResetPlanner.classList.add("d-none");

            if (btnPrintNoten) btnPrintNoten.classList.remove("d-none");
            if (btnSaveNotenPdf) btnSaveNotenPdf.classList.remove("d-none");

            renderGradeTable();
        });
    }

    const btnAddCustomSubject = document.getElementById("btnAddCustomSubject");

    if (btnSavePlannerPdf) {
        btnSavePlannerPdf.addEventListener("click", () => {
            const canvas = document.getElementById("plannerPrintCanvas");
            if (!canvas) return;
            const studentName = document.getElementById("plannerStudentName")?.value || "Schüler";
            const filename = `Stundenplan_${studentName.replace(/\s+/g, '_')}.pdf`;
            
            if (window.html2pdf) {
                const opt = {
                    margin:       0.2,
                    filename:     filename,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true, logging: false },
                    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
                    pagebreak:    { mode: 'avoid-all' }
                };
                html2pdf().set(opt).from(canvas).save();
            } else {
                window.print();
            }
        });
    }

    if (btnPrintPlanner) {
        btnPrintPlanner.addEventListener("click", () => {
            window.print();
        });
    }

    if (btnSaveNotenPdf) {
        btnSaveNotenPdf.addEventListener("click", () => {
            const canvas = document.getElementById("notenPrintCanvas");
            if (!canvas) return;
            canvas.style.display = "block";
            const studentName = document.getElementById("plannerStudentName")?.value || "Schüler";
            const filename = `Notenuebersicht_${studentName.replace(/\s+/g, '_')}.pdf`;
            
            if (window.html2pdf) {
                const opt = {
                    margin:       0.3,
                    filename:     filename,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true, logging: false },
                    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
                    pagebreak:    { mode: 'avoid-all' }
                };
                html2pdf().set(opt).from(canvas).save().then(() => {
                    canvas.style.display = "none";
                }).catch(() => {
                    canvas.style.display = "none";
                });
            } else {
                window.print();
                canvas.style.display = "none";
            }
        });
    }

    if (btnPrintNoten) {
        btnPrintNoten.addEventListener("click", () => {
            window.print();
        });
    }

    if (btnResetPlanner) {
        btnResetPlanner.addEventListener("click", () => {
            if (confirm("Möchtest du den aktuellen Stundenplan wirklich leeren?")) {
                timetableData = {};
                savePlannerState();
                renderTimetableGrid();
            }
        });
    }

    if (btnAddCustomSubject) {
        btnAddCustomSubject.addEventListener("click", () => {
            const name = prompt("Name des neuen Fachs:");
            if (name && name.trim()) {
                const colors = ["#2563eb", "#dc2626", "#16a34a", "#7c3aed", "#d97706", "#db2777", "#0891b2"];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const newSub = { name: name.trim(), color, text: "#ffffff" };
                plannerSubjects.push(newSub);
                activeSubject = newSub;
                savePlannerState();
                renderSubjectPalette();
            }
        });
    }
});

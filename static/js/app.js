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
});

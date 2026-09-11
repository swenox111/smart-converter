document.addEventListener("DOMContentLoaded", () => {
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

    // Option Containers
    const toolOptions = document.getElementById("toolOptions");
    const optionRotate = document.getElementById("optionRotate");
    const optionPages = document.getElementById("optionPages");
    const optionCompress = document.getElementById("optionCompress");

    // Tool Labels Map
    const toolLabels = {
        "compress_pdf": "Compress PDF",
        "pdf_converter": "PDF Converter",
        "pdf_ocr": "PDF OCR (Texterkennung)",
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

        // Highlight selected tool card
        document.querySelectorAll(".tool-card .card").forEach(card => card.classList.remove("active-card"));
        const activeCard = document.querySelector(`.tool-card[data-tool="${toolId}"] .card`);
        if (activeCard) activeCard.classList.add("active-card");

        // Options toggling
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

    // Card selection event
    document.querySelectorAll(".tool-card").forEach(card => {
        card.addEventListener("click", () => {
            const toolId = card.getAttribute("data-tool");
            updateToolUI(toolId);
            dropzoneCard.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Drag and Drop & Touch handlers
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

    // Conversion Trigger
    convertBtn.addEventListener('click', async () => {
        if (!selectedFiles.length) {
            alert("Bitte wähle mindestens eine Datei aus.");
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
                const errData = await response.json().catch(() => ({ detail: "Unbekannter Serverfehler" }));
                throw new Error(errData.detail || "Konvertierung fehlgeschlagen.");
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get("content-disposition");
            let fileName = "converted_document";
            if (contentDisposition && contentDisposition.includes("filename=")) {
                fileName = contentDisposition.split("filename=")[1].replace(/"/g, "");
            }

            // Download Trigger
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            alert("Fehler bei der Konvertierung: " + err.message);
        } finally {
            convertBtn.disabled = false;
            progressBar.classList.add("d-none");
        }
    });

    // Search Filtering
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

    // Category Filtering
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

    // Theme Toggle
    document.getElementById("toggleTheme").addEventListener("click", () => {
        document.body.classList.toggle("bg-light");
        document.body.classList.toggle("text-dark");
        document.body.classList.toggle("bg-dark");
        document.body.classList.toggle("text-light");
    });

    // Initialize Default State
    updateToolUI("compress_pdf");
});

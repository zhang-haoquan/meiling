document.addEventListener('DOMContentLoaded', () => {
    // Submenu Toggle Logic
    const submenuToggle = document.querySelector('.submenu-toggle');
    const settingsMenu = document.getElementById('settings-menu');
    
    if (submenuToggle && settingsMenu) {
        const submenu = settingsMenu.querySelector('.submenu');
        submenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            settingsMenu.classList.toggle('submenu-open');
            submenu.classList.toggle('open');
        });
    }

    // Routing Configuration
    const routes = {
        '#kb': 'view-kb',
        '#settings-kb': 'view-settings-kb',
        '#settings-graph': 'view-settings-graph',
        '#settings-spare': 'view-settings-spare',
        // Optional: map other links to default or specific placeholders if needed
        '#logs': 'view-kb', // Demo: redirect logs to KB for now or show alert
        '#graph': 'view-kb' // Demo
    };

    function updateView() {
        // Get current hash, default to #kb
        let hash = window.location.hash;
        if (!hash || !routes[hash]) {
            // If hash is empty or not in routes, default to #kb if it's empty, 
            // otherwise just keep current view or handle 404. 
            // For this demo, force #kb if empty.
            if (!hash) hash = '#kb';
            else if (!routes[hash]) return; // Don't switch if route unknown
        }

        const viewId = routes[hash];
        const targetView = document.getElementById(viewId);

        if (targetView) {
            // 1. Hide all views
            document.querySelectorAll('.page-view').forEach(view => {
                view.classList.remove('active');
            });
            
            // 2. Show target view
            targetView.classList.add('active');

            // 3. Update Sidebar Active State
            updateSidebarState(hash);
        }
    }

    function updateSidebarState(hash) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Find the link matching the hash
        // Note: Use attribute selector to match exactly
        const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);
        
        if (activeLink) {
            const navItem = activeLink.parentElement;
            navItem.classList.add('active');

            // Handle Submenu Parent State
            const parentList = navItem.parentElement;
            if (parentList.classList.contains('submenu')) {
                const parentItem = parentList.parentElement;
                // Open the submenu if it's not already open
                if (!parentItem.classList.contains('submenu-open')) {
                    parentItem.classList.add('submenu-open');
                    const submenu = parentItem.querySelector('.submenu');
                    if (submenu) submenu.classList.add('open');
                }
            }
        }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', updateView);

    // Initial load
    updateView();

    // ============================================================
    // Tag Management Logic (KB Settings)
    // ============================================================
    
    // Mock Data
    let tags = [
        { id: 1, name: '厂商', kbs: ['A厂商', 'B厂商', 'C厂商'] },
        { id: 2, name: '设备', kbs: ['吸塑机', '注塑机'] },
        { id: 3, name: '文档类型', kbs: ['产品手册', '维修手册'] }
    ];

    let currentPage = 1;
    const itemsPerPage = 5; // Updated to 5 items per page
    let sortOrder = 'asc'; // or 'desc'
    let itemToDeleteId = null;

    // Elements
    const tagTableBody = document.getElementById('tag-table-body');
    const loadingOverlay = document.getElementById('tag-loading');
    const prevBtn = document.getElementById('tag-prev-page');
    const nextBtn = document.getElementById('tag-next-page');
    const currentPageSpan = document.getElementById('tag-current-page');
    const modalAdd = document.getElementById('modal-add-tag');
    const modalEdit = document.getElementById('modal-edit-tag');
    const modalDelete = document.getElementById('modal-confirm-delete');
    const modalViewTag = document.getElementById('modal-view-tag');
    const btnAddTag = document.getElementById('btn-add-tag');
    const btnSaveTag = document.getElementById('btn-save-tag');
    const btnSaveEditTag = document.getElementById('btn-save-edit-tag');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const tagNameInput = document.getElementById('tag-name-input');
    const tagNameError = document.getElementById('tag-name-error');
    const tagNameEditInput = document.getElementById('tag-name-edit-input');
    const tagNameEditError = document.getElementById('tag-name-edit-error');

    // Tag Input Elements
    const tagKbInput = document.getElementById('tag-kb-input');
    const tagKbContainer = document.getElementById('tag-kb-container');
    const tagKbError = document.getElementById('tag-kb-error');
    const tagKbEditInput = document.getElementById('tag-kb-edit-input');
    const tagKbEditContainer = document.getElementById('tag-kb-edit-container');
    const tagKbEditError = document.getElementById('tag-kb-edit-error');

    // State for tags
    let currentTagKBs = [];
    let currentEditTagKBs = [];

    let itemToEditId = null;

    // Tag Helper Functions
    function renderTagKBs(container, tagKBs, isEditMode) {
        const input = container.querySelector('input');
        Array.from(container.children).forEach(child => {
            if (child !== input) {
                container.removeChild(child);
            }
        });

        tagKBs.forEach((tag, index) => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag-chip';
            tagEl.innerHTML = `
                <span>${tag}</span>
                <i class="fa-solid fa-xmark remove-tag" data-index="${index}" data-edit="${isEditMode}"></i>
            `;
            container.insertBefore(tagEl, input);
        });

        input.value = '';
    }

    function handleTagKBInput(event, isEditMode) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const input = event.target;
            const value = input.value.trim();
            const tagKBs = isEditMode ? currentEditTagKBs : currentTagKBs;
            const errorEl = isEditMode ? tagKbEditError : tagKbError;
            const container = isEditMode ? tagKbEditContainer : tagKbContainer;

            if (!value) return;

            if (value.length > 20) {
                if (errorEl) errorEl.textContent = '标签长度不能超过20个字符';
                return;
            }

            if (tagKBs.length >= 20) {
                if (errorEl) errorEl.textContent = '最多添加20个标签';
                return;
            }

            if (tagKBs.includes(value)) {
                if (errorEl) errorEl.textContent = '标签已存在';
                return;
            }

            if (errorEl) errorEl.textContent = '';

            if (isEditMode) {
                currentEditTagKBs.push(value);
                renderTagKBs(container, currentEditTagKBs, true);
            } else {
                currentTagKBs.push(value);
                renderTagKBs(container, currentTagKBs, false);
            }
        }
    }

    function handleTagKBDelete(event) {
        if (event.target.classList.contains('remove-tag')) {
            const index = parseInt(event.target.dataset.index);
            const isEditMode = event.target.dataset.edit === 'true';
            const container = isEditMode ? tagKbEditContainer : tagKbContainer;

            if (isEditMode) {
                currentEditTagKBs.splice(index, 1);
                renderTagKBs(container, currentEditTagKBs, true);
            } else {
                currentTagKBs.splice(index, 1);
                renderTagKBs(container, currentTagKBs, false);
            }
        }
    }

    // Initialization
    if (tagTableBody) {
        renderTagTable();
        setupTagEventListeners();
    }

    function renderTagTable() {
        showLoading(true);
        
        // Simulate API delay
        setTimeout(() => {
            // Sort
            tags.sort((a, b) => {
                if (sortOrder === 'asc') return a.name.localeCompare(b.name, 'zh-CN');
                return b.name.localeCompare(a.name, 'zh-CN');
            });

            // Pagination
            const totalPages = Math.ceil(tags.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
            if (currentPage < 1) currentPage = 1;

            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageData = tags.slice(start, end);

            // Render HTML
            tagTableBody.innerHTML = '';
            
            // 1. Render existing data
            if (pageData.length > 0) {
                pageData.forEach(tag => {
                    // Format KB tags like entity-type-tag
                    let kbsTagsHtml = '';
                    const kbs = tag.kbs || [];
                    if (kbs.length > 0) {
                        const displayCount = 3;
                        const showTags = kbs.slice(0, displayCount);
                        showTags.forEach(kb => {
                            kbsTagsHtml += `<span class="entity-type-tag">${kb}</span>`;
                        });
                        if (kbs.length > displayCount + 1) {
                             kbsTagsHtml += `<span class="entity-type-more">... +${kbs.length - displayCount}</span>`;
                        } else if (kbs.length === displayCount + 1) {
                             kbsTagsHtml += `<span class="entity-type-tag">${kbs[displayCount]}</span>`;
                        }
                    } else {
                        kbsTagsHtml = '-';
                    }
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${tag.name}</td>
                        <td>${kbsTagsHtml}</td>
                        <td class="action-cell">
                            <button class="icon-btn" onclick="openViewTagModal(${tag.id})" title="查看">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                            <button class="icon-btn edit-btn" onclick="openEditModal(${tag.id})" title="编辑">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button class="icon-btn delete-btn" onclick="openDeleteModal(${tag.id})" title="删除">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    `;
                    tagTableBody.appendChild(row);
                });
            }

            // 2. Fill with empty rows to reach itemsPerPage (5)
            const emptyRowsCount = itemsPerPage - pageData.length;
            if (emptyRowsCount > 0) {
                for (let i = 0; i < emptyRowsCount; i++) {
                    const row = document.createElement('tr');
                    row.className = 'empty-row';
                    // Empty rows are non-interactive placeholders
                    // Removed click event listener as requested
                    
                    // Empty cells
                    row.innerHTML = `
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    `;
                    tagTableBody.appendChild(row);
                }
            }

            // Update Controls
            currentPageSpan.textContent = `${currentPage} / ${totalPages > 0 ? totalPages : 1}`;
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage >= totalPages || totalPages === 0;

            showLoading(false);
        }, 500); // 500ms fake delay
    }

    function formatKBs(kbs) {
        if (!kbs || kbs.length === 0) return '-';
        if (kbs.length <= 2) return kbs.join('、');
        return `${kbs.slice(0, 2).join('、')} 等${kbs.length}个知识库`;
    }

    function showLoading(show) {
        if (loadingOverlay) {
            if (show) loadingOverlay.classList.remove('hidden');
            else loadingOverlay.classList.add('hidden');
        }
    }

    function setupTagEventListeners() {
        // Pagination
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTagTable();
            }
        });
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(tags.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTagTable();
            }
        });

        // Sorting
        const sortHeader = document.querySelector('.sortable[data-sort="name"]');
        if (sortHeader) {
            sortHeader.addEventListener('click', () => {
                sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                renderTagTable();
            });
        }

        // Add Tag Modal
        btnAddTag.addEventListener('click', () => {
            openModal(modalAdd);
            resetAddForm();
        });

        btnSaveTag.addEventListener('click', () => {
            saveNewTag();
        });

        if (btnSaveEditTag) {
            btnSaveEditTag.addEventListener('click', () => {
                saveEditTag();
            });
        }

        // Delete Modal
        btnConfirmDelete.addEventListener('click', () => {
            deleteTag();
        });

        // Tag Input Event Listeners
        if (tagKbContainer) {
            tagKbContainer.addEventListener('click', (e) => {
                if (e.target === tagKbContainer) {
                    tagKbInput.focus();
                }
            });
            tagKbContainer.addEventListener('click', handleTagKBDelete);
        }

        if (tagKbInput) {
            tagKbInput.addEventListener('keydown', (e) => handleTagKBInput(e, false));
        }

        if (tagKbEditContainer) {
            tagKbEditContainer.addEventListener('click', (e) => {
                if (e.target === tagKbEditContainer) {
                    tagKbEditInput.focus();
                }
            });
            tagKbEditContainer.addEventListener('click', handleTagKBDelete);
        }

        if (tagKbEditInput) {
            tagKbEditInput.addEventListener('keydown', (e) => handleTagKBInput(e, true));
        }

        // Close Modals
        document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                closeAllModals();
            });
        });
    }

    function resetAddForm() {
        tagNameInput.value = '';
        tagNameError.textContent = '';
        tagNameInput.classList.remove('error-border');

        // Reset Tags
        currentTagKBs = [];
        if (tagKbContainer) {
            renderTagKBs(tagKbContainer, currentTagKBs, false);
        }
        if (tagKbError) {
            tagKbError.textContent = '';
        }
    }

    function saveNewTag() {
        const name = tagNameInput.value.trim();

        // Validation
        if (!name) {
            showError('标签类型不能为空');
            return;
        }
        if (tags.some(t => t.name === name)) {
            showError('标签类型已存在');
            return;
        }

        // Save
        const newTag = {
            id: Date.now(),
            name: name,
            kbs: [...currentTagKBs]
        };

        tags.unshift(newTag);
        closeAllModals();
        currentPage = 1;
        renderTagTable();
    }

    window.openEditModal = function(id) {
        itemToEditId = id;
        const tag = tags.find(t => t.id === id);
        if (tag) {
            if (tagNameEditInput) {
                tagNameEditInput.value = tag.name;
                tagNameEditError.textContent = '';
                tagNameEditInput.classList.remove('error-border');
            }

            // Load Tags
            currentEditTagKBs = [...(tag.kbs || [])];
            if (tagKbEditContainer) {
                renderTagKBs(tagKbEditContainer, currentEditTagKBs, true);
            }
            if (tagKbEditError) {
                tagKbEditError.textContent = '';
            }

            openModal(modalEdit);
        }
    };

    window.openViewTagModal = function(id) {
        try {
            const tag = tags.find(t => t.id === id);
            if (!tag) {
                console.error('Tag not found:', id);
                alert('无法获取标签详情');
                return;
            }

            const viewTagName = document.getElementById('view-tag-name');
            if (viewTagName) {
                viewTagName.textContent = tag.name || '-';
            }
            
            const viewTagKBs = document.getElementById('view-tag-kbs');
            if (viewTagKBs) {
                viewTagKBs.innerHTML = '';
                
                if (tag.kbs && tag.kbs.length > 0) {
                    tag.kbs.forEach(kb => {
                        const kbSpan = document.createElement('span');
                        kbSpan.className = 'entity-type-tag';
                        kbSpan.textContent = kb;
                        viewTagKBs.appendChild(kbSpan);
                    });
                } else {
                    viewTagKBs.innerHTML = '<span style="color:#999; font-size: 14px;">无关联知识库</span>';
                }
            }
            
            openModal(modalViewTag);
        } catch (error) {
            console.error('Error opening view tag modal:', error);
            alert('打开查看标签模态框时发生错误');
        }
    };

    function saveEditTag() {
        const name = tagNameEditInput.value.trim();

        if (!name) {
            tagNameEditError.textContent = '标签类型不能为空';
            tagNameEditInput.classList.add('error-border');
            return;
        }

        if (tags.some(t => t.name === name && t.id !== itemToEditId)) {
            tagNameEditError.textContent = '标签类型已存在';
            tagNameEditInput.classList.add('error-border');
            return;
        }

        const tagIndex = tags.findIndex(t => t.id === itemToEditId);
        if (tagIndex !== -1) {
            tags[tagIndex].name = name;
            tags[tagIndex].kbs = [...currentEditTagKBs];
            closeAllModals();
            renderTagTable();
        }
    }

    function showError(msg) {
        tagNameError.textContent = msg;
        tagNameInput.classList.add('error-border');
    }

    // Expose to global scope for inline onclick
    window.openDeleteModal = function(id) {
        itemToDeleteId = id;
        openModal(modalDelete);
    };

    function deleteTag() {
        if (itemToDeleteId) {
            tags = tags.filter(t => t.id !== itemToDeleteId);
            itemToDeleteId = null;
            closeAllModals();
            renderTagTable();
        }
    }

    function openModal(modal) {
        if (modal) modal.classList.remove('hidden');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }


    // ============================================================
    // Document Type Management Logic (Knowledge Graph Settings)
    // ============================================================

    // Mock Data
    let docTypes = [
        { id: 1, name: '产品维修', entityTypes: ['故障代码', '维修步骤', '备件信息', '工具列表', '安全警告'] },
        { id: 2, name: '产品运营', entityTypes: ['运营指标', '活动方案'] },
        { id: 3, name: '技术文档', entityTypes: ['API接口', '数据结构', '系统架构', '部署流程'] },
        { id: 4, name: '用户手册', entityTypes: [] },
        { id: 5, name: '培训材料', entityTypes: ['课程大纲', '讲师介绍'] },
        { id: 6, name: '行业标准', entityTypes: ['标准编号', '发布日期', '适用范围'] },
        { id: 7, name: '测试文档', entityTypes: ['测试用例', '测试报告'] }
    ];

    let docTypeCurrentPage = 1;
    const docTypeItemsPerPage = 6;
    let docTypeItemToDeleteId = null;
    let docTypeItemToEditId = null;

    // Elements
    const docTypeTableBody = document.getElementById('doctype-table-body');
    const docTypeLoading = document.getElementById('doctype-loading');
    const docTypePrevBtn = document.getElementById('doctype-prev-page');
    const docTypeNextBtn = document.getElementById('doctype-next-page');
    const docTypeCurrentPageSpan = document.getElementById('doctype-current-page');
    const modalAddDocType = document.getElementById('modal-add-doctype');
    const modalEditDocType = document.getElementById('modal-edit-doctype');
    const modalViewDocType = document.getElementById('modal-view-doctype'); // View Modal
    const modalDeleteDocType = document.getElementById('modal-confirm-delete-doctype');
    const btnAddDocType = document.getElementById('btn-add-doctype');
    const btnSaveDocType = document.getElementById('btn-save-doctype');
    const btnSaveEditDocType = document.getElementById('btn-save-edit-doctype');
    const btnConfirmDeleteDocType = document.getElementById('btn-confirm-delete-doctype');
    const docTypeNameInput = document.getElementById('doctype-name-input');
    const docTypeNameError = document.getElementById('doctype-name-error');
    const docTypeNameEditInput = document.getElementById('doctype-name-edit-input');
    const docTypeNameEditError = document.getElementById('doctype-name-edit-error');

    // Tag Input Elements
    const docTypeEntityInput = document.getElementById('doctype-entity-input');
    const docTypeEntityContainer = document.getElementById('doctype-entity-container');
    const docTypeEntityError = document.getElementById('doctype-entity-error');
    const docTypeEntityEditInput = document.getElementById('doctype-entity-edit-input');
    const docTypeEntityEditContainer = document.getElementById('doctype-entity-edit-container');
    const docTypeEntityEditError = document.getElementById('doctype-entity-edit-error');
    
    // State for tags
    let currentTags = [];
    let currentEditTags = [];

    // Tag Helper Functions
    function renderTags(container, tags, isEditMode) {
        const input = container.querySelector('input');
        // Keep the input, remove other elements (tags)
        Array.from(container.children).forEach(child => {
            if (child !== input) {
                container.removeChild(child);
            }
        });

        tags.forEach((tag, index) => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag-chip';
            tagEl.innerHTML = `
                <span>${tag}</span>
                <i class="fa-solid fa-xmark remove-tag" data-index="${index}" data-edit="${isEditMode}"></i>
            `;
            container.insertBefore(tagEl, input);
        });
        
        input.value = '';
    }

    function handleTagInput(event, isEditMode) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const input = event.target;
            const value = input.value.trim();
            const tags = isEditMode ? currentEditTags : currentTags;
            const errorEl = isEditMode ? docTypeEntityEditError : docTypeEntityError;
            const container = isEditMode ? docTypeEntityEditContainer : docTypeEntityContainer;
            
            if (!value) return;
            
            if (value.length > 20) {
                if (errorEl) errorEl.textContent = '标签长度不能超过20个字符';
                return;
            }
            
            if (tags.length >= 20) {
                if (errorEl) errorEl.textContent = '最多添加20个标签';
                return;
            }
            
            if (tags.includes(value)) {
                if (errorEl) errorEl.textContent = '标签已存在';
                return;
            }
            
            if (errorEl) errorEl.textContent = '';
            
            if (isEditMode) {
                currentEditTags.push(value);
                renderTags(container, currentEditTags, true);
            } else {
                currentTags.push(value);
                renderTags(container, currentTags, false);
            }
        }
    }

    function handleTagDelete(event) {
        if (event.target.classList.contains('remove-tag')) {
            const index = parseInt(event.target.dataset.index);
            const isEditMode = event.target.dataset.edit === 'true';
            const container = isEditMode ? docTypeEntityEditContainer : docTypeEntityContainer;
            
            if (isEditMode) {
                currentEditTags.splice(index, 1);
                renderTags(container, currentEditTags, true);
            } else {
                currentTags.splice(index, 1);
                renderTags(container, currentTags, false);
            }
        }
    }

    // Initialization
    if (docTypeTableBody) {
        renderDocTypeTable();
        setupDocTypeEventListeners();
    }

    function renderDocTypeTable() {
        showDocTypeLoading(true);

        setTimeout(() => {
            // Pagination
            const totalPages = Math.ceil(docTypes.length / docTypeItemsPerPage);
            if (docTypeCurrentPage > totalPages && totalPages > 0) docTypeCurrentPage = totalPages;
            if (docTypeCurrentPage < 1) docTypeCurrentPage = 1;

            const start = (docTypeCurrentPage - 1) * docTypeItemsPerPage;
            const end = start + docTypeItemsPerPage;
            const pageData = docTypes.slice(start, end);

            // Render HTML
            docTypeTableBody.innerHTML = '';
            
            // 1. Render existing data
            if (pageData.length > 0) {
                pageData.forEach(doctype => {
                    // Format Entity Types tags
                    let entityTagsHtml = '';
                    const entities = doctype.entityTypes || [];
                    if (entities.length > 0) {
                        const displayCount = 3;
                        const showTags = entities.slice(0, displayCount);
                        showTags.forEach(tag => {
                            entityTagsHtml += `<span class="entity-type-tag">${tag}</span>`;
                        });
                        if (entities.length > 4) { // Logic: If > 4, show 3 + "...+N"
                             entityTagsHtml += `<span class="entity-type-more">... +${entities.length - displayCount}</span>`;
                        } else if (entities.length === 4) {
                             entityTagsHtml += `<span class="entity-type-tag">${entities[3]}</span>`;
                        }
                    } else {
                        entityTagsHtml = '-';
                    }

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${doctype.name}</td>
                        <td>${entityTagsHtml}</td>
                        <td class="action-cell">
                             <button class="icon-btn" onclick="openViewDocTypeModal(${doctype.id})" title="查看">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                            <button class="icon-btn edit-btn" onclick="openEditDocTypeModal(${doctype.id})" title="编辑">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button class="icon-btn delete-btn" onclick="openDeleteDocTypeModal(${doctype.id})" title="删除">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    `;
                    docTypeTableBody.appendChild(row);
                });
            }

            // 2. Fill with empty rows to reach docTypeItemsPerPage (6)
            const emptyRowsCount = docTypeItemsPerPage - pageData.length;
            if (emptyRowsCount > 0) {
                for (let i = 0; i < emptyRowsCount; i++) {
                    const row = document.createElement('tr');
                    row.className = 'empty-row';
                    // Add empty cells corresponding to columns (Name, Entity Types, Actions)
                    // Use &nbsp; to maintain row height
                    row.innerHTML = `
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    `;
                    docTypeTableBody.appendChild(row);
                }
            }

            // Update Controls
            if (docTypeCurrentPageSpan) {
                docTypeCurrentPageSpan.textContent = `${docTypeCurrentPage} / ${totalPages > 0 ? totalPages : 1}`;
            }
            if (docTypePrevBtn) {
                docTypePrevBtn.disabled = docTypeCurrentPage === 1;
            }
            if (docTypeNextBtn) {
                docTypeNextBtn.disabled = docTypeCurrentPage >= totalPages || totalPages === 0;
            }

            showDocTypeLoading(false);
        }, 500);
    }

    function showDocTypeLoading(show) {
        if (docTypeLoading) {
            if (show) docTypeLoading.classList.remove('hidden');
            else docTypeLoading.classList.add('hidden');
        }
    }

    function setupDocTypeEventListeners() {
        // Pagination
        if (docTypePrevBtn) {
            docTypePrevBtn.addEventListener('click', () => {
                if (docTypeCurrentPage > 1) {
                    docTypeCurrentPage--;
                    renderDocTypeTable();
                }
            });
        }
        if (docTypeNextBtn) {
            docTypeNextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(docTypes.length / docTypeItemsPerPage);
                if (docTypeCurrentPage < totalPages) {
                    docTypeCurrentPage++;
                    renderDocTypeTable();
                }
            });
        }

        // Add DocType Modal
        if (btnAddDocType) {
            btnAddDocType.addEventListener('click', () => {
                openModal(modalAddDocType);
                resetAddDocTypeForm();
            });
        }

        if (btnSaveDocType) {
            btnSaveDocType.addEventListener('click', () => {
                saveNewDocType();
            });
        }

        if (btnSaveEditDocType) {
            btnSaveEditDocType.addEventListener('click', () => {
                saveEditDocType();
            });
        }

        // Delete Modal
        if (btnConfirmDeleteDocType) {
            btnConfirmDeleteDocType.addEventListener('click', () => {
                deleteDocType();
            });
        }

        // Tag Input Event Listeners
        if (docTypeEntityContainer) {
            docTypeEntityContainer.addEventListener('click', (e) => {
                if (e.target === docTypeEntityContainer) {
                    docTypeEntityInput.focus();
                }
            });
            docTypeEntityContainer.addEventListener('click', handleTagDelete);
        }
        
        if (docTypeEntityInput) {
            docTypeEntityInput.addEventListener('keydown', (e) => handleTagInput(e, false));
        }

        if (docTypeEntityEditContainer) {
            docTypeEntityEditContainer.addEventListener('click', (e) => {
                if (e.target === docTypeEntityEditContainer) {
                    docTypeEntityEditInput.focus();
                }
            });
            docTypeEntityEditContainer.addEventListener('click', handleTagDelete);
        }

        if (docTypeEntityEditInput) {
            docTypeEntityEditInput.addEventListener('keydown', (e) => handleTagInput(e, true));
        }
    }

    function resetAddDocTypeForm() {
        if (docTypeNameInput) {
            docTypeNameInput.value = '';
            docTypeNameInput.classList.remove('error-border');
        }
        if (docTypeNameError) {
            docTypeNameError.textContent = '';
        }

        // Reset Tags
        currentTags = [];
        if (docTypeEntityContainer) {
            renderTags(docTypeEntityContainer, currentTags, false);
        }
        if (docTypeEntityError) {
            docTypeEntityError.textContent = '';
        }
    }

    function saveNewDocType() {
        const name = docTypeNameInput.value.trim();

        // Validation
        if (!name) {
            showDocTypeError('文档类型不能为空');
            return;
        }
        if (docTypes.some(t => t.name === name)) {
            showDocTypeError('文档类型已存在');
            return;
        }

        // Save
        const newDocType = {
            id: Date.now(),
            name: name,
            entityTypes: [...currentTags]
        };

        docTypes.unshift(newDocType);
        closeAllModals();
        docTypeCurrentPage = 1;
        renderDocTypeTable();
    }

    window.openEditDocTypeModal = function(id) {
        docTypeItemToEditId = id;
        const doctype = docTypes.find(t => t.id === id);
        if (doctype) {
            if (docTypeNameEditInput) {
                docTypeNameEditInput.value = doctype.name;
                docTypeNameEditInput.classList.remove('error-border');
            }
            if (docTypeNameEditError) {
                docTypeNameEditError.textContent = '';
            }
            
            // Load Tags
            currentEditTags = [...(doctype.entityTypes || [])];
            if (docTypeEntityEditContainer) {
                renderTags(docTypeEntityEditContainer, currentEditTags, true);
            }
            if (docTypeEntityEditError) {
                docTypeEntityEditError.textContent = '';
            }

            openModal(modalEditDocType);
        }
    };

    function saveEditDocType() {
        const name = docTypeNameEditInput.value.trim();

        if (!name) {
            if (docTypeNameEditError) docTypeNameEditError.textContent = '文档类型不能为空';
            if (docTypeNameEditInput) docTypeNameEditInput.classList.add('error-border');
            return;
        }

        if (docTypes.some(t => t.name === name && t.id !== docTypeItemToEditId)) {
            if (docTypeNameEditError) docTypeNameEditError.textContent = '文档类型已存在';
            if (docTypeNameEditInput) docTypeNameEditInput.classList.add('error-border');
            return;
        }

        const index = docTypes.findIndex(t => t.id === docTypeItemToEditId);
        if (index !== -1) {
            docTypes[index].name = name;
            docTypes[index].entityTypes = [...currentEditTags];
            closeAllModals();
            renderDocTypeTable();
        }
    }

    function showDocTypeError(msg) {
        if (docTypeNameError) docTypeNameError.textContent = msg;
        if (docTypeNameInput) docTypeNameInput.classList.add('error-border');
    }

    window.openViewDocTypeModal = function(id) {
        try {
            const doctype = docTypes.find(t => t.id === id);
            if (!doctype) {
                console.error('Document Type not found:', id);
                alert('无法获取文档类型详情');
                return;
            }

            if (modalViewDocType) {
                // Populate Name
                // Fix: Use ID selector to match HTML
                const viewName = document.getElementById('view-doctype-name');
                if (viewName) {
                    viewName.textContent = doctype.name || '-';
                }
                
                // Populate Tags
                // Fix: Use ID selector to match HTML
                const viewTagsContainer = document.getElementById('view-doctype-entities');
                if (viewTagsContainer) {
                    viewTagsContainer.innerHTML = ''; // Clear previous content
                    
                    if (doctype.entityTypes && doctype.entityTypes.length > 0) {
                        doctype.entityTypes.forEach(tag => {
                            const tagSpan = document.createElement('span');
                            tagSpan.className = 'entity-type-tag';
                            tagSpan.textContent = tag;
                            viewTagsContainer.appendChild(tagSpan);
                        });
                    } else {
                        viewTagsContainer.innerHTML = '<span style="color:#999; font-size: 14px;">无实体类型配置</span>';
                    }
                }
                
                openModal(modalViewDocType);
            }
        } catch (error) {
            console.error('Error opening view modal:', error);
            alert('系统错误，无法查看详情');
        }
    };

    window.openDeleteDocTypeModal = function(id) {
        docTypeItemToDeleteId = id;
        openModal(modalDeleteDocType);
    };

    function deleteDocType() {
        try {
            if (docTypeItemToDeleteId) {
                console.log(`[System] Starting deletion for Document Type ID: ${docTypeItemToDeleteId}`);
                
                // Find the doc type to be deleted
                const docTypeToDelete = docTypes.find(dt => dt.id === docTypeItemToDeleteId);
                
                if (docTypeToDelete) {
                    // Remove from docTypes list
                    docTypes = docTypes.filter(t => t.id !== docTypeItemToDeleteId);
                }

                docTypeItemToDeleteId = null;
                closeAllModals();
                renderDocTypeTable();
            }
        } catch (error) {
            console.error('[System] Error during document type deletion:', error);
            alert('删除操作失败，请重试');
        }
    }

    // ============================================================
    // Nameplate Cascade Settings Logic
    // ============================================================

    // Mock Data Structure for Cascade
    // Structure: { typeName: { deviceName: [station1, station2, ...] } }
    let cascadeData = {
    };

    // Current Selections
    let selectedType = null;
    let selectedDevice = null;

    // DOM Elements
    const colType = document.getElementById('cascade-col-type');
    const colDevice = document.getElementById('cascade-col-device');
    const colStation = document.getElementById('cascade-col-station');

    // Multi-Select Wrapper Elements
    // Note: The wrappers are container divs for the custom dropdowns
    // Buttons
    const btnAddType = document.getElementById('btn-add-type');
    const btnAddDevice = document.getElementById('btn-add-device');
    const btnAddStation = document.getElementById('btn-add-station');

    const listType = document.getElementById('list-type');
    const listDevice = document.getElementById('list-device');
    const listStation = document.getElementById('list-station');

    const availableDevices = ['25号吸塑机', '26号吸塑机', '30号注塑机', '31号注塑机', '32号冲压机', '33号焊接机', '34号装配线'];
    const availableStations = ['成型工位', '剪边工位', '上料工位', '加热工位', '伺服电机'];

    // TextInput Class for Cascade Fields
    class TextInput {
        constructor(wrapperId, placeholder, onAdd) {
            this.wrapper = document.getElementById(wrapperId);
            this.placeholder = placeholder;
            this.onAdd = onAdd;

            if (this.wrapper) {
                this.render();
                this.bindEvents();
            }
        }

        render() {
            this.wrapper.innerHTML = `
                <input type="text" 
                       class="text-input-field" 
                       placeholder="${this.placeholder}"
                       maxlength="20">
            `;
            this.input = this.wrapper.querySelector('.text-input-field');
        }

        bindEvents() {
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addNewItem();
                }
            });
        }

        addNewItem() {
            const value = this.input.value.trim();
            
            if (!value) {
                return;
            }

            if (value.length > 20) {
                alert('输入内容不能超过20个字符');
                return;
            }

            if (this.onAdd) {
                this.onAdd(value);
            }

            this.input.value = '';
        }

        focus() {
            if (this.input) {
                this.input.focus();
            }
        }

        setDisabled(disabled) {
            if (disabled) {
                this.input.disabled = true;
                this.input.style.backgroundColor = '#f5f5f5';
            } else {
                this.input.disabled = false;
                this.input.style.backgroundColor = '#fff';
            }
        }
    }

    // Instances
    let tiType, tiDevice, tiStation;

    // Initialize Text Inputs
    function initCascadeInputs() {
        tiType = new TextInput('ti-wrapper-type', '点击回车添加，最多输入20个字', (value) => {
            if (!cascadeData[value]) {
                cascadeData[value] = {};
                renderCascadeLists();
                // Automatically select the newly added item
                selectTypeItem(value);
            } else {
                alert('该设备类型已存在');
            }
        });
        
        tiDevice = new TextInput('ti-wrapper-device', '点击回车添加，最多输入20个字', (value) => {
            if (!selectedType) {
                alert('请先选择设备类型');
                return;
            }
            if (!cascadeData[selectedType][value]) {
                cascadeData[selectedType][value] = [];
                renderCascadeLists();
                selectDeviceItem(value);
            } else {
                alert('该设备已存在于当前类型下');
            }
        });
        
        tiStation = new TextInput('ti-wrapper-station', '点击回车添加，最多输入20个字', (value) => {
            if (!selectedType || !selectedDevice) {
                alert('请先选择设备和设备类型');
                return;
            }
            const currentStations = cascadeData[selectedType][selectedDevice];
            if (!currentStations.includes(value)) {
                currentStations.push(value);
                renderStationList();
            } else {
                alert('该工位已存在于当前设备下');
            }
        });
    }

    // Render Lists
    function renderCascadeLists() {
        renderTypeList();
        renderDeviceList();
        renderStationList();
        updateColumnStates();
    }

    function renderTypeList() {
        listType.innerHTML = '';
        Object.keys(cascadeData).forEach(type => {
            const item = createListItem(type, type === selectedType);
            item.onclick = (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    selectTypeItem(type);
                }
            };
            item.querySelector('.delete-btn').onclick = (e) => {
                e.stopPropagation();
                deleteTypeItem(type);
            };
            listType.appendChild(item);
        });
    }

    function renderDeviceList() {
        listDevice.innerHTML = '';
        if (selectedType && cascadeData[selectedType]) {
            Object.keys(cascadeData[selectedType]).forEach(device => {
                const item = createListItem(device, device === selectedDevice);
                item.onclick = (e) => {
                    if (!e.target.classList.contains('delete-btn')) {
                        selectDeviceItem(device);
                    }
                };
                item.querySelector('.delete-btn').onclick = (e) => {
                    e.stopPropagation();
                    deleteDeviceItem(device);
                };
                listDevice.appendChild(item);
            });
        }
    }

    function renderStationList() {
        listStation.innerHTML = '';
        if (selectedType && selectedDevice && cascadeData[selectedType][selectedDevice]) {
            cascadeData[selectedType][selectedDevice].forEach((station, index) => {
                const item = createListItem(station, false);
                item.onclick = null; // Stations are leaf nodes
                item.querySelector('.delete-btn').onclick = (e) => {
                    e.stopPropagation();
                    deleteStationItem(index);
                };
                listStation.appendChild(item);
            });
        }
    }

    function createListItem(text, isActive) {
        const div = document.createElement('div');
        div.className = `list-item ${isActive ? 'active' : ''}`;
        div.innerHTML = `
            <span class="item-text" title="${text}">${text}</span>
            <i class="fa-solid fa-times delete-btn" title="删除"></i>
        `;
        return div;
    }

    // Interaction Handlers
    function selectTypeItem(type) {
        if (selectedType === type) return;
        selectedType = type;
        selectedDevice = null; // Reset next level
        renderCascadeLists();
    }

    function selectDeviceItem(device) {
        if (selectedDevice === device) return;
        selectedDevice = device;
        renderCascadeLists();
    }

    // Delete Handlers
    function deleteTypeItem(type) {
        delete cascadeData[type];
        if (selectedType === type) {
            selectedType = null;
            selectedDevice = null;
        }
        renderCascadeLists();
    }

    function deleteDeviceItem(device) {
        delete cascadeData[selectedType][device];
        if (selectedDevice === device) {
            selectedDevice = null;
        }
        renderCascadeLists();
    }

    function deleteStationItem(index) {
        cascadeData[selectedType][selectedDevice].splice(index, 1);
        renderStationList();
    }

    // State Management
    function updateColumnStates() {
        // Type Column is always active
        if (tiType) tiType.setDisabled(false);
        
        // Device Column
        if (selectedType) {
            colDevice.classList.remove('disabled');
            if (tiDevice) tiDevice.setDisabled(false);
        } else {
            colDevice.classList.add('disabled');
            if (tiDevice) tiDevice.setDisabled(true);
        }

        // Station Column
        if (selectedDevice) {
            colStation.classList.remove('disabled');
            if (tiStation) tiStation.setDisabled(false);
        } else {
            colStation.classList.add('disabled');
            if (tiStation) tiStation.setDisabled(true);
        }
    }

    // Initial Calls
    initCascadeInputs();
    renderCascadeLists();

});

/* eslint-env browser */
/* global Vue, fetch, setTimeout, setInterval, clearInterval */

const { createApp } = Vue;

// SVG icon helpers
const icons = {
  layers: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 2 10 6.5v7L12 22 2 15.5v-7L12 2z"/><path d="M12 22v-6.5"/><path d="m22 8.5-10 7-10-7"/><path d="m2 15.5 10-7 10 7"/></svg>`,
  tasks: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>`,
  folder: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  book: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  film: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>`,
  video: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  file: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  folderIcon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  link: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  inbox: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  play: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

function statusBadge(status) {
  const map = {
    queued: { cls: "badge-default", label: "Queued" },
    "in-progress": { cls: "badge-blue", label: "Rendering" },
    completed: { cls: "badge-green", label: "Done" },
    failed: { cls: "badge-red", label: "Failed" },
    cancelled: { cls: "badge-amber", label: "Cancelled" },
  };
  return map[status] || { cls: "badge-default", label: status };
}

createApp({
  data() {
    return {
      templates: [],
      selectedTemplateId: "",
      templateSearch: "",
      templateCategory: "全部",
      inputPropsText: "{}",
      jobs: [],
      activeMenu: "templates",
      loadingTemplates: false,
      creating: false,
      errorMessage: "",
      pollTimer: null,
      toasts: [],
      globalLoading: false,
      syncRendering: false,
      syncTimeoutMs: 300000,
      syncResult: null,
      rendersFolders: [],
      rendersFoldersPage: 1,
      rendersFoldersPageSize: 20,
      rendersFoldersTotal: 0,
      rendersFoldersLoading: false,
      rendersFoldersSelected: [],
      rendersFoldersDeleteLoading: false,
    };
  },

  computed: {
    selectedTemplate() {
      return (
        this.templates.find((t) => t.id === this.selectedTemplateId) || null
      );
    },
    templateCategories() {
      const counts = this.templates.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {});
      return [
        { label: "全部", value: "全部", count: this.templates.length },
        ...Object.entries(counts)
          .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
          .map(([label, count]) => ({ label, value: label, count })),
      ];
    },
    filteredTemplates() {
      const kw = this.templateSearch.trim().toLowerCase();
      return this.templates.filter((t) => {
        if (
          this.templateCategory !== "全部" &&
          t.category !== this.templateCategory
        )
          return false;
        if (!kw) return true;
        const text = [
          t.id,
          t.name,
          t.description,
          t.category,
          t.style,
          t.useCase,
          t.durationLabel,
          ...(t.tags || []),
          ...(t.scenes || []).map((s) => `${s.title} ${s.summary}`),
          ...(t.animationHighlights || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(kw);
      });
    },
    activeJobsCount() {
      return this.jobs.filter(
        (j) => j.status === "queued" || j.status === "in-progress",
      ).length;
    },
  },

  methods: {
    icon(name) {
      return icons[name] || "";
    },

    statusBadge,

    normalizeJob(job) {
      const numericProgress = Number(job?.progress);
      return {
        id: String(job?.id || ""),
        status: job?.status || "queued",
        progress: Number.isFinite(numericProgress)
          ? Math.max(0, Math.min(1, numericProgress))
          : 0,
        videoUrl: job?.videoUrl || "",
        data: job?.data || {},
        error:
          typeof job?.error?.message === "string"
            ? job.error.message
            : String(job?.error || ""),
        createdAt: job?.createdAt || null,
        startedAt: job?.startedAt || null,
        completedAt: job?.completedAt || null,
        updatedAt: job?.updatedAt || null,
        elapsedMs: job?.elapsedMs || null,
      };
    },

    upsertJob(job) {
      const normalizedJob = this.normalizeJob(job);
      if (!normalizedJob.id) return;
      const currentIndex = this.jobs.findIndex(
        (item) => item.id === normalizedJob.id,
      );
      if (currentIndex === -1) {
        this.jobs.unshift(normalizedJob);
        return;
      }
      this.jobs.splice(currentIndex, 1, {
        ...this.jobs[currentIndex],
        ...normalizedJob,
      });
    },

    getMetaLine(t) {
      if (!t) return "";
      return [
        t.category,
        t.durationLabel,
        `${t.width}×${t.height}`,
        `${t.fps}fps`,
      ].join(" · ");
    },

    showToast(message, type = "info") {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
      }, 4000);
    },

    async fetchTemplates() {
      this.loadingTemplates = true;
      this.globalLoading = true;
      this.errorMessage = "";
      try {
        const res = await fetch("/api/templates");
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "获取模板失败");
        this.templates = result.data;
        if (!this.selectedTemplateId && result.data.length > 0) {
          this.selectedTemplateId = result.data[0].id;
          this.inputPropsText = JSON.stringify(
            result.data[0].defaultInputProps,
            null,
            2,
          );
        }
        this.showToast(`已加载 ${result.data.length} 个模板`, "success");
      } catch (e) {
        this.errorMessage = e.message;
        this.showToast(e.message, "error");
      } finally {
        this.loadingTemplates = false;
        this.globalLoading = false;
      }
    },

    onTemplateChange() {
      const t = this.selectedTemplate;
      if (!t) return;
      this.inputPropsText = JSON.stringify(t.defaultInputProps, null, 2);
      this.syncResult = null;
    },

    selectTemplate(id) {
      if (!id || id === this.selectedTemplateId) return;
      this.selectedTemplateId = id;
      this.onTemplateChange();
    },

    setTemplateCategory(cat) {
      this.templateCategory = cat;
      if (
        !this.filteredTemplates.some((t) => t.id === this.selectedTemplateId) &&
        this.filteredTemplates.length > 0
      ) {
        this.selectTemplate(this.filteredTemplates[0].id);
      }
    },

    parseInputProps() {
      try {
        return { ok: true, data: JSON.parse(this.inputPropsText) };
      } catch {
        return { ok: false, message: "inputProps 不是合法 JSON" };
      }
    },

    async createRenderJob() {
      this.errorMessage = "";
      if (!this.selectedTemplateId) {
        this.showToast("请先选择模板", "error");
        return;
      }
      const parsed = this.parseInputProps();
      if (!parsed.ok) {
        this.errorMessage = parsed.message;
        this.showToast(parsed.message, "error");
        return;
      }
      this.creating = true;
      this.globalLoading = true;
      try {
        const res = await fetch("/api/renders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: this.selectedTemplateId,
            inputProps: parsed.data,
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "创建任务失败");
        this.upsertJob({
          id: result.data.jobId,
          status: result.data.status || "queued",
          progress: 0,
          videoUrl: "",
          data: {
            templateId: this.selectedTemplateId,
            inputProps: parsed.data,
          },
        });
        void this.fetchJobs({ silent: true });
        this.showToast("渲染任务已创建", "success");
        this.activeMenu = "jobs";
      } catch (e) {
        this.errorMessage = e.message;
        this.showToast(e.message, "error");
      } finally {
        this.creating = false;
        this.globalLoading = false;
      }
    },

    async createRenderSync() {
      this.errorMessage = "";
      this.syncResult = null;
      if (!this.selectedTemplateId) {
        this.showToast("请先选择模板", "error");
        return;
      }
      const parsed = this.parseInputProps();
      if (!parsed.ok) {
        this.errorMessage = parsed.message;
        this.showToast(parsed.message, "error");
        return;
      }
      this.syncRendering = true;
      this.globalLoading = true;
      try {
        const res = await fetch("/api/renders/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: this.selectedTemplateId,
            inputProps: parsed.data,
            timeoutMs: Number(this.syncTimeoutMs),
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "同步渲染失败");
        this.syncResult = {
          jobId: result.data.jobId,
          status: result.data.status,
          videoUrl: result.data.videoUrl,
        };
        this.showToast("同步渲染完成", "success");
      } catch (e) {
        this.errorMessage = e.message;
        this.showToast(e.message, "error");
      } finally {
        this.syncRendering = false;
        this.globalLoading = false;
      }
    },

    async fetchJobs({ silent = false } = {}) {
      try {
        const res = await fetch("/api/renders");
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "获取任务失败");
        const jobList = Array.isArray(result.data) ? result.data : [];
        this.jobs = jobList
          .map((job) => this.normalizeJob(job))
          .filter((job) => job.id);
      } catch (e) {
        if (!silent) {
          this.showToast(e.message, "error");
        }
      }
    },

    async refreshJobs() {
      await this.fetchJobs({ silent: true });
    },

    startPolling() {
      this.stopPolling();
      this.pollTimer = setInterval(() => this.refreshJobs(), 2000);
    },

    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },

    formatSize(size) {
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
      if (size < 1024 * 1024 * 1024)
        return (size / 1024 / 1024).toFixed(1) + " MB";
      return (size / 1024 / 1024 / 1024).toFixed(1) + " GB";
    },

    async fetchRendersFolders(page = 1) {
      this.rendersFoldersLoading = true;
      try {
        const res = await fetch(
          `/api/renders-folders?page=${page}&pageSize=${this.rendersFoldersPageSize}`,
        );
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "获取失败");
        this.rendersFolders = result.data.list;
        this.rendersFoldersPage = result.data.page;
        this.rendersFoldersTotal = result.data.total;
      } catch (e) {
        this.showToast(e.message, "error");
      } finally {
        this.rendersFoldersLoading = false;
      }
    },

    async deleteRendersFoldersBatch() {
      if (!this.rendersFoldersSelected.length) {
        this.showToast("请先勾选文件", "error");
        return;
      }
      this.rendersFoldersDeleteLoading = true;
      try {
        const res = await fetch("/api/renders-folders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: this.rendersFoldersSelected }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "删除失败");
        this.showToast(`已删除 ${result.data.deleted.length} 项`, "success");
        if (result.data.failed.length)
          this.showToast(`${result.data.failed.length} 项失败`, "error");
        this.rendersFoldersSelected = [];
        this.fetchRendersFolders(this.rendersFoldersPage);
      } catch (e) {
        this.showToast(e.message, "error");
      } finally {
        this.rendersFoldersDeleteLoading = false;
      }
    },

    onRendersFoldersPageChange(page) {
      const maxPage =
        Math.ceil(this.rendersFoldersTotal / this.rendersFoldersPageSize) || 1;
      if (page < 1 || page > maxPage) return;
      this.fetchRendersFolders(page);
    },

    toggleAllFiles(e) {
      this.rendersFoldersSelected = e.target.checked
        ? this.rendersFolders.map((f) => f.name)
        : [];
    },
  },

  async mounted() {
    await Promise.all([
      this.fetchTemplates(),
      this.fetchJobs({ silent: true }),
      this.fetchRendersFolders(1),
    ]);
    this.startPolling();
  },

  beforeUnmount() {
    this.stopPolling();
  },

  template: `
    <div class="layout">
      <!-- Loading overlay -->
      <div v-if="globalLoading" class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">处理中...</div>
      </div>

      <!-- Toasts -->
      <div class="toast-container">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="'toast-' + toast.type">
          <span v-html="toast.type === 'success' ? icon('check') : toast.type === 'error' ? icon('alert') : icon('info')"></span>
          {{ toast.message }}
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon">
              <span v-html="icon('film')"></span>
            </div>
            <div>
              <div class="brand-name">Remotion</div>
              <div class="brand-sub">Studio</div>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-label">工作区</div>

          <button class="nav-item" :class="{ active: activeMenu === 'templates' }" @click="activeMenu = 'templates'">
            <span v-html="icon('layers')"></span>
            模板中心
            <span class="nav-badge">{{ templates.length }}</span>
          </button>

          <button class="nav-item" :class="{ active: activeMenu === 'jobs' }" @click="activeMenu = 'jobs'">
            <span v-html="icon('tasks')"></span>
            渲染任务
            <span v-if="activeJobsCount > 0" class="nav-loading-state">
              <span class="spinner spinner-sm nav-loading-spinner"></span>
              <span class="nav-badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;">{{ activeJobsCount }}</span>
            </span>
            <span v-else class="nav-badge">{{ jobs.length }}</span>
          </button>

          <button class="nav-item" :class="{ active: activeMenu === 'renders-folders' }" @click="activeMenu = 'renders-folders'; fetchRendersFolders(rendersFoldersPage)">
            <span v-html="icon('folder')"></span>
            输出文件
          </button>

          <div class="nav-label" style="margin-top:8px;">参考</div>

          <button class="nav-item" :class="{ active: activeMenu === 'docs' }" @click="activeMenu = 'docs'">
            <span v-html="icon('book')"></span>
            API 文档
          </button>
        </nav>

        <div class="sidebar-footer">
          <span class="status-dot"></span>
          <span class="status-text">服务运行中</span>
        </div>
      </aside>

      <!-- Main -->
      <main class="main">
        <!-- Top bar -->
        <div class="topbar">
          <div class="topbar-title">
            <span v-if="activeMenu === 'templates'">
              模板中心
              <span v-if="selectedTemplate"> / <strong>{{ selectedTemplate.name }}</strong></span>
            </span>
            <span v-else-if="activeMenu === 'jobs'">渲染任务</span>
            <span v-else-if="activeMenu === 'renders-folders'">输出文件管理</span>
            <span v-else-if="activeMenu === 'docs'">API 文档</span>
          </div>
          <div class="topbar-actions">
            <button class="btn btn-ghost btn-sm" @click="fetchTemplates" :disabled="loadingTemplates">
              <span v-html="icon('refresh')"></span>
              刷新
            </button>
          </div>
        </div>

        <!-- Content (workspace-mode 时三栏各自滚动) -->
        <div class="content" :class="{ 'workspace-mode': activeMenu === 'templates' }">

          <!-- ════ TEMPLATES ════ -->
          <div v-if="activeMenu === 'templates'" class="template-workspace">

            <!-- Col 1: 模板浏览器 -->
            <div class="workspace-col">
              <div class="workspace-col-header">
                <span class="panel-title">模板浏览器</span>
                <span class="badge badge-default">{{ filteredTemplates.length }}/{{ templates.length }}</span>
              </div>
              <div class="workspace-col-body">
                <!-- Search -->
                <div class="form-group">
                  <div class="search-box">
                    <span v-html="icon('search')"></span>
                    <input v-model.trim="templateSearch" type="text" placeholder="搜索名称、场景、标签..." />
                  </div>
                </div>

                <!-- Quick jump -->
                <div class="form-group">
                  <label>快速跳转</label>
                  <select v-model="selectedTemplateId" @change="onTemplateChange" :disabled="loadingTemplates">
                    <option value="" disabled>选择模板</option>
                    <option v-for="t in filteredTemplates" :key="t.id" :value="t.id">
                      {{ t.name }} · {{ t.category }}
                    </option>
                  </select>
                </div>

                <!-- Category chips -->
                <div class="filter-chips" style="margin-bottom:14px;">
                  <button
                    v-for="cat in templateCategories"
                    :key="cat.value"
                    class="chip"
                    :class="{ active: templateCategory === cat.value }"
                    @click="setTemplateCategory(cat.value)"
                  >
                    {{ cat.label }}<span class="chip-count">{{ cat.count }}</span>
                  </button>
                </div>

                <!-- Template list -->
                <div class="template-list">
                  <button
                    v-for="t in filteredTemplates"
                    :key="t.id"
                    class="tpl-card"
                    :class="{ active: t.id === selectedTemplateId }"
                    @click="selectTemplate(t.id)"
                  >
                    <div class="tpl-card-top">
                      <div>
                        <div class="tpl-name">{{ t.name }}</div>
                        <div class="tpl-meta">{{ getMetaLine(t) }}</div>
                      </div>
                      <div class="tpl-id">{{ t.id }}</div>
                    </div>
                    <div class="tpl-desc">{{ t.description }}</div>
                    <div class="tpl-tags" v-if="t.tags && t.tags.length">
                      <span v-for="tag in t.tags.slice(0,4)" :key="tag" class="tpl-tag">{{ tag }}</span>
                    </div>
                  </button>

                  <div v-if="!filteredTemplates.length" class="tpl-empty">
                    <span v-html="icon('inbox')"></span>
                    没有匹配的模板
                  </div>
                </div>
              </div>
            </div>

            <!-- Col 2: 模板详情 -->
            <div class="workspace-col">
              <div class="workspace-col-header">
                <span class="panel-title">{{ selectedTemplate ? selectedTemplate.name : '模板详情' }}</span>
                <span v-if="selectedTemplate" class="badge badge-blue">{{ selectedTemplate.category }}</span>
              </div>
              <div class="workspace-col-body">
                <div v-if="!selectedTemplate" class="detail-empty">
                  <span v-html="icon('film')"></span>
                  从左侧选择一个模板
                </div>

                <template v-else>
                  <div class="detail-badges">
                    <span class="badge badge-default">{{ selectedTemplate.category }}</span>
                    <span class="badge badge-default">{{ selectedTemplate.durationLabel }}</span>
                    <span class="badge badge-default">{{ selectedTemplate.width }}×{{ selectedTemplate.height }}</span>
                    <span class="badge badge-default">{{ selectedTemplate.fps }} fps</span>
                  </div>

                  <div class="stat-grid">
                    <div class="stat-item">
                      <div class="stat-label">适用场景</div>
                      <div class="stat-value">{{ selectedTemplate.useCase }}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">风格方向</div>
                      <div class="stat-value">{{ selectedTemplate.style }}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">资源需求</div>
                      <div class="stat-value">{{ selectedTemplate.assetSummary || '按默认 props 渲染' }}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">可编辑字段</div>
                      <div class="stat-value">{{ (selectedTemplate.editableFields || []).length }} 项</div>
                    </div>
                  </div>

                  <div class="detail-section" v-if="selectedTemplate.scenes && selectedTemplate.scenes.length">
                    <div class="detail-section-title">视频结构</div>
                    <div class="detail-list">
                      <div v-for="scene in selectedTemplate.scenes" :key="scene.title" class="detail-item">
                        <strong>{{ scene.title }}</strong>
                        <span>{{ scene.summary }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-section" v-if="selectedTemplate.animationHighlights && selectedTemplate.animationHighlights.length">
                    <div class="detail-section-title">动效亮点</div>
                    <div class="detail-list">
                      <div v-for="h in selectedTemplate.animationHighlights" :key="h" class="detail-item">
                        <span>{{ h }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-section" v-if="selectedTemplate.inputSchema && selectedTemplate.inputSchema.length">
                    <div class="detail-section-title">输入参数</div>
                    <div class="detail-list">
                      <div v-for="field in selectedTemplate.inputSchema.slice(0,8)" :key="field.key" class="detail-item">
                        <strong>{{ field.label }} <span v-if="field.required" style="color:#3b82f6;font-size:11px;">必填</span></strong>
                        <span>{{ field.description }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-section" v-if="selectedTemplate.example">
                    <div class="detail-section-title">示例文案</div>
                    <p style="font-size:13px;color:var(--text-2);margin-bottom:8px;">{{ selectedTemplate.example.title }}</p>
                    <div class="example-lines" v-if="selectedTemplate.example.copy && selectedTemplate.example.copy.length">
                      <div v-for="line in selectedTemplate.example.copy" :key="line" class="example-line">{{ line }}</div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Col 3: JSON 编辑器 -->
            <div class="workspace-col">
              <div class="workspace-col-header">
                <span class="panel-title">inputProps 编辑器</span>
                <span v-if="selectedTemplate" class="badge badge-default" style="font-family:var(--mono);font-size:10px;">{{ selectedTemplate.id }}</span>
              </div>
              <div class="workspace-col-body">
                <div class="form-group">
                  <label>JSON 输入参数</label>
                  <textarea class="json-editor" v-model="inputPropsText"></textarea>
                </div>

                <div v-if="syncResult" class="sync-result" style="margin-bottom:12px;">
                  <div class="sync-result-title">同步渲染完成</div>
                  <div class="sync-result-row">Job ID: <code>{{ syncResult.jobId }}</code></div>
                  <div class="sync-result-row">状态: {{ syncResult.status }}</div>
                  <div class="sync-result-row" style="margin-top:6px;">
                    <a :href="syncResult.videoUrl" target="_blank">
                      <span v-html="icon('link')"></span> 打开视频
                    </a>
                  </div>
                </div>

                <div v-if="errorMessage" class="error-msg" style="margin-bottom:12px;">
                  <span v-html="icon('alert')"></span> {{ errorMessage }}
                </div>
              </div>
              <!-- 操作按钮固定在底部 -->
              <div class="workspace-col-footer">
                <div class="action-grid" style="margin-bottom:10px;">
                  <button
                    class="btn btn-primary btn-lg btn-full"
                    @click="createRenderJob"
                    :disabled="creating || syncRendering || !selectedTemplateId"
                  >
                    <span v-if="creating" class="spinner spinner-sm"></span>
                    <span v-else v-html="icon('play')"></span>
                    {{ creating ? '创建中...' : '创建渲染任务' }}
                  </button>
                  <button
                    class="btn btn-secondary btn-lg btn-full"
                    @click="createRenderSync"
                    :disabled="syncRendering || creating || !selectedTemplateId"
                  >
                    <span v-if="syncRendering" class="spinner spinner-sm"></span>
                    <span v-else v-html="icon('video')"></span>
                    {{ syncRendering ? '渲染中...' : '同步渲染' }}
                  </button>
                </div>
                <div>
                  <label>同步等待超时 (ms)</label>
                  <input v-model.number="syncTimeoutMs" type="number" min="1000" max="900000" />
                </div>
              </div>
            </div>

          </div>

          <!-- ════ JOBS ════ -->
          <div v-if="activeMenu === 'jobs'">
            <div class="page-header">
              <div class="page-eyebrow">Render Queue</div>
              <div class="page-title">渲染任务</div>
              <div class="page-desc">任务每 2 秒自动刷新状态。</div>
            </div>

            <div v-if="!jobs.length" class="panel">
              <div class="job-empty">
                <span v-html="icon('inbox')"></span>
                暂无任务，前往模板中心创建渲染任务
              </div>
            </div>

            <div v-else class="job-list">
              <div v-for="job in jobs" :key="job.id" class="job-card">
                <div class="job-header">
                  <code class="job-id">{{ job.id }}</code>
                  <span class="badge" :class="statusBadge(job.status).cls">
                    {{ statusBadge(job.status).label }}
                  </span>
                </div>
                <div class="job-meta">模板: {{ job.data?.templateId || '—' }}</div>

                <div v-if="job.status === 'in-progress'" class="job-progress">
                  <div class="job-progress-bar" :style="{ width: Math.round((job.progress || 0) * 100) + '%' }"></div>
                </div>
                <div v-if="job.status === 'in-progress'" style="font-size:11px;color:var(--text-3);margin-top:4px;">
                  {{ Math.round((job.progress || 0) * 100) }}%
                </div>

                <div class="job-actions" v-if="job.videoUrl || job.error">
                  <a v-if="job.videoUrl" :href="job.videoUrl" target="_blank" class="btn btn-secondary btn-sm">
                    <span v-html="icon('play')"></span> 查看视频
                  </a>
                  <div v-if="job.error" style="font-size:12px;color:var(--red);">
                    <span v-html="icon('alert')"></span> {{ job.error }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════ FILES ════ -->
          <div v-if="activeMenu === 'renders-folders'">
            <div class="page-header">
              <div class="page-eyebrow">File Manager</div>
              <div class="page-title">输出文件管理</div>
            </div>

            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">渲染输出</span>
                <div style="display:flex;gap:8px;">
                  <button class="btn btn-danger btn-sm"
                    @click="deleteRendersFoldersBatch"
                    :disabled="rendersFoldersDeleteLoading || !rendersFoldersSelected.length">
                    <span v-if="rendersFoldersDeleteLoading" class="spinner spinner-sm"></span>
                    <span v-else v-html="icon('trash')"></span>
                    删除选中 {{ rendersFoldersSelected.length ? '(' + rendersFoldersSelected.length + ')' : '' }}
                  </button>
                  <button class="btn btn-secondary btn-sm"
                    @click="fetchRendersFolders(rendersFoldersPage)"
                    :disabled="rendersFoldersLoading">
                    <span v-if="rendersFoldersLoading" class="spinner spinner-sm"></span>
                    <span v-else v-html="icon('refresh')"></span>
                    刷新
                  </button>
                </div>
              </div>

              <div v-if="rendersFoldersLoading && !rendersFolders.length" style="padding:40px;text-align:center;color:var(--text-3);">
                <div class="spinner" style="margin:0 auto 10px;"></div>
                加载中...
              </div>

              <div v-else class="file-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th class="th-check">
                        <input type="checkbox"
                          :checked="rendersFoldersSelected.length === rendersFolders.length && rendersFolders.length > 0"
                          @change="toggleAllFiles" />
                      </th>
                      <th>文件名</th>
                      <th>类型</th>
                      <th>大小</th>
                      <th>修改时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="f in rendersFolders" :key="f.name">
                      <td class="td-check">
                        <input type="checkbox" :value="f.name" v-model="rendersFoldersSelected" />
                      </td>
                      <td>
                        <span class="file-icon" v-html="f.isDirectory ? icon('folderIcon') : icon('file')"></span>
                        {{ f.name }}
                      </td>
                      <td>{{ f.isDirectory ? '文件夹' : '文件' }}</td>
                      <td>{{ formatSize(f.size) }}</td>
                      <td>{{ new Date(f.mtime).toLocaleString() }}</td>
                    </tr>
                    <tr v-if="!rendersFolders.length">
                      <td colspan="5" style="text-align:center;color:var(--text-3);padding:32px;">暂无输出文件</td>
                    </tr>
                  </tbody>
                </table>

                <div class="pagination" style="padding:0 18px 14px;">
                  <div class="pagination-info">共 {{ rendersFoldersTotal }} 项</div>
                  <div class="pagination-btns">
                    <button class="btn btn-ghost btn-sm"
                      :disabled="rendersFoldersPage === 1"
                      @click="onRendersFoldersPageChange(rendersFoldersPage - 1)">上一页</button>
                    <span style="font-size:12px;color:var(--text-3);padding:0 8px;line-height:30px;">
                      {{ rendersFoldersPage }} / {{ Math.max(1, Math.ceil(rendersFoldersTotal / rendersFoldersPageSize)) }}
                    </span>
                    <button class="btn btn-ghost btn-sm"
                      :disabled="rendersFoldersPage * rendersFoldersPageSize >= rendersFoldersTotal"
                      @click="onRendersFoldersPageChange(rendersFoldersPage + 1)">下一页</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════ DOCS ════ -->
          <div v-if="activeMenu === 'docs'" style="max-width:820px;">
            <div class="page-header">
              <div class="page-eyebrow">Reference</div>
              <div class="page-title">API 文档</div>
              <div class="page-desc">所有接口返回统一格式：<code>{ success, code, message, data? }</code></div>
            </div>

            <div class="panel doc-section" style="margin-bottom:12px;">
              <div class="panel-header">
                <span class="panel-title">
                  <span class="badge method-get endpoint">GET</span>
                  /api/templates
                </span>
              </div>
              <div class="panel-body">
                <p style="font-size:13px;color:var(--text-3);margin-bottom:12px;">获取所有可用模板列表</p>
                <pre>{"success":true,"code":"SUCCESS","message":"获取模板列表成功","data":[{"id":"hello-world","name":"Hello World","fps":30,"width":1920,"height":1080,...}]}</pre>
              </div>
            </div>

            <div class="panel doc-section" style="margin-bottom:12px;">
              <div class="panel-header">
                <span class="panel-title">
                  <span class="badge method-post endpoint">POST</span>
                  /api/renders
                </span>
              </div>
              <div class="panel-body">
                <p style="font-size:13px;color:var(--text-3);margin-bottom:12px;">创建异步渲染任务，立即返回 jobId</p>
                <label style="margin-bottom:6px;">请求体</label>
                <pre>{"templateId":"hello-world","inputProps":{"titleText":"测试标题","titleColor":"#FF0000"}}</pre>
                <label style="margin:12px 0 6px;">响应</label>
                <pre>{"success":true,"code":"SUCCESS","data":{"jobId":"f47ac10b-...","status":"queued"}}</pre>
                <div style="margin-top:10px;font-size:12px;color:var(--text-3);">
                  错误码：<code>INVALID_REQUEST</code> · <code>TEMPLATE_NOT_FOUND</code>
                </div>
              </div>
            </div>

            <div class="panel doc-section" style="margin-bottom:12px;">
              <div class="panel-header">
                <span class="panel-title">
                  <span class="badge method-post endpoint">POST</span>
                  /api/renders/sync
                </span>
              </div>
              <div class="panel-body">
                <p style="font-size:13px;color:var(--text-3);margin-bottom:12px;">同步等待渲染完成，直接返回视频地址（短视频或内部调用推荐）</p>
                <label style="margin-bottom:6px;">请求体</label>
                <pre>{"templateId":"zoom-pulse","inputProps":{"imageUrl":"https://..."},"timeoutMs":300000}</pre>
                <label style="margin:12px 0 6px;">成功响应</label>
                <pre>{"success":true,"data":{"jobId":"...","status":"completed","videoUrl":"http://...","elapsedMs":38920}}</pre>
                <ul style="margin-top:10px;">
                  <li><code>timeoutMs</code> 范围 1000 ~ 900000</li>
                  <li>超时返回 202，建议改用异步接口轮询</li>
                </ul>
              </div>
            </div>

            <div class="panel doc-section" style="margin-bottom:12px;">
              <div class="panel-header">
                <span class="panel-title">
                  <span class="badge method-get endpoint">GET</span>
                  /api/renders/:jobId
                </span>
              </div>
              <div class="panel-body">
                <p style="font-size:13px;color:var(--text-3);margin-bottom:12px;">查询任务状态与进度</p>
                <pre>{"success":true,"data":{"status":"in-progress","progress":0.65,"elapsedMs":12345}}</pre>
                <pre style="margin-top:8px;">{"success":true,"data":{"status":"completed","videoUrl":"http://.../renders/xxx.mp4","elapsedMs":45231}}</pre>
              </div>
            </div>

            <div class="panel doc-section" style="margin-bottom:12px;">
              <div class="panel-header">
                <span class="panel-title">
                  <span class="badge method-delete endpoint">DELETE</span>
                  /api/renders/:jobId
                </span>
              </div>
              <div class="panel-body">
                <p style="font-size:13px;color:var(--text-3);margin-bottom:12px;">取消排队或进行中的任务</p>
                <pre>{"success":true,"code":"SUCCESS","data":{"jobId":"..."}}</pre>
                <div style="margin-top:10px;font-size:12px;color:var(--text-3);">
                  错误码：<code>JOB_NOT_FOUND</code> · <code>JOB_NOT_CANCELLABLE</code>
                </div>
              </div>
            </div>

            <div class="panel doc-section">
              <div class="panel-header"><span class="panel-title">错误码速查</span></div>
              <div class="panel-body">
                <ul>
                  <li><code>SUCCESS</code> — 成功</li>
                  <li><code>INVALID_REQUEST</code> — 请求参数不合法</li>
                  <li><code>TEMPLATE_NOT_FOUND</code> — 模板不存在</li>
                  <li><code>JOB_NOT_FOUND</code> — 任务不存在</li>
                  <li><code>JOB_NOT_CANCELLABLE</code> — 任务不可取消</li>
                  <li><code>INTERNAL_ERROR</code> — 服务器内部错误</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  `,
}).mount("#app");

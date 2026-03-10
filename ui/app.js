/* eslint-env browser */

const { createApp } = Vue;

createApp({
  data() {
    return {
      templates: [],
      selectedTemplateId: "",
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
      // 文件管理
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
      return this.templates.find((item) => item.id === this.selectedTemplateId) || null;
    },
  },
  methods: {
    async fetchRendersFolders(page = 1) {
      this.rendersFoldersLoading = true;
      try {
        const response = await fetch(`/api/renders-folders?page=${page}&pageSize=${this.rendersFoldersPageSize}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "获取输出文件夹失败");
        this.rendersFolders = result.data.list;
        this.rendersFoldersPage = result.data.page;
        this.rendersFoldersPageSize = result.data.pageSize;
        this.rendersFoldersTotal = result.data.total;
      } catch (e) {
        this.showToast(e.message || "获取输出文件夹失败", "error");
      } finally {
        this.rendersFoldersLoading = false;
      }
    },

    async deleteRendersFoldersBatch() {
      if (!this.rendersFoldersSelected.length) {
        this.showToast("请先选择要删除的文件", "error");
        return;
      }
      this.rendersFoldersDeleteLoading = true;
      try {
        const response = await fetch("/api/renders-folders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: this.rendersFoldersSelected }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "删除失败");
        this.showToast(`删除成功: ${result.data.deleted.join(", ")}`, "success");
        if (result.data.failed.length) {
          this.showToast(`部分失败: ${result.data.failed.map(f => f.name).join(", ")}`, "error");
        }
        this.rendersFoldersSelected = [];
        this.fetchRendersFolders(this.rendersFoldersPage);
      } catch (e) {
        this.showToast(e.message || "删除失败", "error");
      } finally {
        this.rendersFoldersDeleteLoading = false;
      }
    },

    onRendersFoldersPageChange(page) {
      this.fetchRendersFolders(page);
    },
    showToast(message, type = "info") {
      const id = Date.now();
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter((toast) => toast.id !== id);
      }, 4000);
    },
    async fetchTemplates() {
      this.loadingTemplates = true;
      this.globalLoading = true;
      this.errorMessage = "";
      try {
        const response = await fetch("/api/templates");
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "获取模板失败");
        }
        this.templates = result.data;
        if (!this.selectedTemplateId && result.data.length > 0) {
          this.selectedTemplateId = result.data[0].id;
          this.inputPropsText = JSON.stringify(result.data[0].defaultInputProps, null, 2);
        }
        this.showToast("模板加载成功", "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "加载模板失败";
        this.errorMessage = message;
        this.showToast(message, "error");
      } finally {
        this.loadingTemplates = false;
        this.globalLoading = false;
      }
    },
    onTemplateChange() {
      const template = this.selectedTemplate;
      if (!template) {
        return;
      }
      this.inputPropsText = JSON.stringify(template.defaultInputProps, null, 2);
      this.syncResult = null;
    },
    parseInputProps() {
      try {
        return {
          ok: true,
          data: JSON.parse(this.inputPropsText),
        };
      } catch {
        return {
          ok: false,
          message: "inputProps 不是合法 JSON",
        };
      }
    },
    async createRenderJob() {
      this.errorMessage = "";
      if (!this.selectedTemplateId) {
        this.errorMessage = "请先选择模板";
        this.showToast("请先选择模板", "error");
        return;
      }

      const parsed = this.parseInputProps();
      if (!parsed.ok) {
        this.errorMessage = parsed.message;
        this.showToast(parsed.message, "error");
        return;
      }
      const inputProps = parsed.data;

      this.creating = true;
      this.globalLoading = true;
      try {
        const response = await fetch("/api/renders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: this.selectedTemplateId,
            inputProps,
          }),
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "创建任务失败");
        }

        this.jobs.unshift({
          id: result.data.jobId,
          status: result.data.status || "queued",
          progress: 0,
          videoUrl: "",
          data: {
            templateId: this.selectedTemplateId,
            inputProps,
          },
        });
        this.showToast("任务创建成功，正在渲染...", "success");
        this.activeMenu = "jobs";
      } catch (error) {
        const message = error instanceof Error ? error.message : "创建任务失败";
        this.errorMessage = message;
        this.showToast(message, "error");
      } finally {
        this.creating = false;
        this.globalLoading = false;
      }
    },
    async createRenderSync() {
      this.errorMessage = "";
      this.syncResult = null;
      if (!this.selectedTemplateId) {
        this.errorMessage = "请先选择模板";
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
        const response = await fetch("/api/renders/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: this.selectedTemplateId,
            inputProps: parsed.data,
            timeoutMs: Number(this.syncTimeoutMs),
          }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "同步渲染失败");
        }

        this.syncResult = {
          jobId: result.data.jobId,
          status: result.data.status,
          videoUrl: result.data.videoUrl,
        };

        this.showToast("同步渲染完成，已返回视频路径", "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "同步渲染失败";
        this.errorMessage = message;
        this.showToast(message, "error");
      } finally {
        this.syncRendering = false;
        this.globalLoading = false;
      }
    },
    async refreshJobs() {
      if (this.jobs.length === 0) {
        return;
      }

      const updatedJobs = await Promise.all(
        this.jobs.map(async (job) => {
          try {
            const response = await fetch(`/api/renders/${job.id}`);
            const result = await response.json();
            if (!result.success) {
              return job;
            }
            const latest = result.data;
            return {
              id: job.id,
              status: latest.status,
              progress: latest.progress ?? 0,
              videoUrl: latest.videoUrl || "",
              data: latest.data || job.data,
              error: latest.error?.message || "",
            };
          } catch {
            return job;
          }
        }),
      );

      this.jobs = updatedJobs;
    },
    startPolling() {
      this.stopPolling();
      this.pollTimer = setInterval(() => {
        this.refreshJobs();
      }, 2000);
    },
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    formatSize(size) {
      if (size < 1024) return size + ' B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
      if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + ' MB';
      return (size / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    }
  },
  async mounted() {
    await this.fetchTemplates();
    this.startPolling();
    this.fetchRendersFolders(1);
  },
  beforeUnmount() {
    this.stopPolling();
  },
  template: `
    <div class="layout">
      <div v-if="globalLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>

      <div class="toast-container">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="'toast-' + toast.type">
          {{ toast.message }}
        </div>
      </div>

      <aside class="sidebar">
        <h2 class="brand">Remotion Console</h2>
        <div class="ui vertical fluid menu" style="border: none; box-shadow: none;">
          <a class="item" :class="{active: activeMenu === 'templates'}" @click="activeMenu = 'templates'">
            <i class="layer group icon"></i> 模板中心
          </a>
          <a class="item" :class="{active: activeMenu === 'jobs'}" @click="activeMenu = 'jobs'">
            <i class="tasks icon"></i> 任务中心
          </a>
          <a class="item" :class="{active: activeMenu === 'renders-folders'}" @click="activeMenu = 'renders-folders'">
            <i class="folder open outline icon"></i> 输出文件管理
          </a>
          <a class="item" :class="{active: activeMenu === 'docs'}" @click="activeMenu = 'docs'">
            <i class="book icon"></i> API 文档
          </a>
        </div>
      </aside>

      <main class="main">
        <h1 class="title">Remotion 模板渲染台</h1>
        <div class="desc">左侧菜单切换模块，右侧通过 API 完成模板渲染与任务查询。</div>

        <div v-if="activeMenu === 'renders-folders'" class="ui segment">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 class="ui header" style="margin: 0;">输出文件管理</h3>
            <div>
              <button class="ui red mini button" @click="deleteRendersFoldersBatch" :class="{loading: rendersFoldersDeleteLoading}" :disabled="rendersFoldersDeleteLoading || !rendersFoldersSelected.length">
                <i class="trash alternate outline icon"></i> 删除选中
              </button>
              <button class="ui primary mini button" @click="fetchRendersFolders(rendersFoldersPage)" :class="{loading: rendersFoldersLoading}" :disabled="rendersFoldersLoading">
                <i class="sync icon"></i> 刷新列表
              </button>
            </div>
          </div>
          <div v-if="rendersFoldersLoading && rendersFolders.length === 0" class="ui active centered inline loader"></div>
          <div v-else>
            <table class="ui celled selectable table">
              <thead>
                <tr>
                  <th class="collapsing">
                    <div class="ui fitted checkbox">
                      <input type="checkbox" :checked="rendersFoldersSelected.length === rendersFolders.length && rendersFolders.length > 0" @change="e => rendersFoldersSelected = e.target.checked ? rendersFolders.map(f=>f.name) : []">
                      <label></label>
                    </div>
                  </th>
                  <th>文件名</th>
                  <th>类型</th>
                  <th>大小</th>
                  <th>修改时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in rendersFolders" :key="f.name">
                  <td class="collapsing">
                    <div class="ui fitted checkbox">
                      <input type="checkbox" :value="f.name" v-model="rendersFoldersSelected">
                      <label></label>
                    </div>
                  </td>
                  <td>
                    <i :class="f.isDirectory ? 'folder icon' : 'file video outline icon'"></i>
                    {{ f.name }}
                  </td>
                  <td>{{ f.isDirectory ? '文件夹' : '文件' }}</td>
                  <td>{{ formatSize(f.size) }}</td>
                  <td>{{ new Date(f.mtime).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top:15px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                共 <strong>{{ rendersFoldersTotal }}</strong> 项
              </div>
              <div class="ui pagination menu" v-if="Math.ceil(rendersFoldersTotal / rendersFoldersPageSize) > 0">
                <a class="item" :class="{disabled: rendersFoldersPage === 1}" @click="onRendersFoldersPageChange(rendersFoldersPage-1)">上一页</a>
                <div class="disabled item">第 {{ rendersFoldersPage }} / {{ Math.ceil(rendersFoldersTotal / rendersFoldersPageSize) || 1 }} 页</div>
                <a class="item" :class="{disabled: rendersFoldersPage * rendersFoldersPageSize >= rendersFoldersTotal}" @click="onRendersFoldersPageChange(rendersFoldersPage+1)">下一页</a>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeMenu === 'templates'" class="card template-card">
          <div class="template-layout">
            <div>
              <label>模板</label>
              <select class="template-select" v-model="selectedTemplateId" @change="onTemplateChange" :disabled="loadingTemplates">
                <option value="" disabled>请选择模板</option>
                <option v-for="item in templates" :key="item.id" :value="item.id">
                  {{ item.name }} ({{ item.id }})
                </option>
              </select>
              <div class="template-list">
                <div v-for="item in templates" :key="item.id" class="muted template-item">
                  <strong style="color:#111827;">{{ item.name }}</strong> - {{ item.description }}
                </div>
                </div>
              <div v-if="selectedTemplate" class="muted" style="margin-top:8px;">
                {{ selectedTemplate.description }} · {{ selectedTemplate.width }}x{{ selectedTemplate.height }} · {{ selectedTemplate.fps }}fps
              </div>
            </div>
            <div>
              <label>inputProps (JSON)</label>
              <textarea class="template-json" v-model="inputPropsText"></textarea>
              <div class="template-actions">
                <div class="action-row">
                <button class="template-action-btn" @click="createRenderJob" :disabled="creating || syncRendering || !selectedTemplateId">
                  {{ creating ? '创建中...' : '创建渲染任务' }}
                </button>
                <button class="template-action-btn secondary-btn" @click="createRenderSync" :disabled="syncRendering || creating || !selectedTemplateId">
                  {{ syncRendering ? '同步渲染中...' : '同步渲染并返回路径' }}
                </button>
                </div>
                <div style="margin-top:10px;">
                  <label>同步等待超时 (毫秒)</label>
                  <input v-model.number="syncTimeoutMs" type="number" min="1000" max="900000" />
                </div>
                <div v-if="syncResult" style="margin-top:10px;padding:10px;border:1px solid #d1fae5;background:#ecfdf5;border-radius:8px;">
                  <div><strong>同步渲染结果</strong></div>
                  <div class="muted" style="margin-top:4px;">Job ID: {{ syncResult.jobId }}</div>
                  <div class="muted">状态: {{ syncResult.status }}</div>
                  <div style="margin-top:6px;"><a :href="syncResult.videoUrl" target="_blank">打开视频路径</a></div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="errorMessage" style="margin-top:10px;color:#dc2626;">{{ errorMessage }}</div>
        </div>

        <div v-if="activeMenu === 'jobs'" class="card jobs">
          <h3 style="margin:0 0 10px;">任务列表</h3>
          <div v-if="jobs.length === 0" class="muted">暂无任务，先在模板中心创建一个任务。</div>
          <div v-for="job in jobs" :key="job.id" style="padding:10px 0;border-top:1px solid #e5e7eb;">
            <div><strong>{{ job.id }}</strong></div>
            <div class="muted" style="margin:6px 0;">模板: {{ job.data?.templateId || '-' }}</div>
            <div>
              <span class="status">{{ job.status }}</span>
              <span class="muted" v-if="job.status === 'in-progress'">进度: {{ Math.round((job.progress || 0) * 100) }}%</span>
            </div>
            <div v-if="job.videoUrl" style="margin-top:6px;">
              <a :href="job.videoUrl" target="_blank">查看视频</a>
            </div>
            <div v-if="job.error" style="margin-top:6px;color:#dc2626;">{{ job.error }}</div>
          </div>
        </div>

        <div v-if="activeMenu === 'docs'" style="max-width:900px;">
          <div class="card">
            <h3 style="margin:0 0 10px;">API 概览</h3>
            <p class="muted">所有 API 返回统一格式：<code>{ success: boolean, code: string, message: string, data?: any }</code></p>
          </div>

          <div class="card">
            <h3 style="margin:0 0 8px;">GET /api/templates</h3>
            <p class="muted">获取所有可用模板列表</p>
            <div style="margin-top:10px;"><strong>响应示例</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "success": true,
  "code": "SUCCESS",
  "message": "获取模板列表成功",
  "data": [
    {
      "id": "hello-world",
      "name": "Hello World",
      "description": "品牌开场标题动画",
      "compositionId": "HelloWorld",
      "durationInFrames": 180,
      "fps": 30,
      "width": 1920,
      "height": 1080,
      "defaultInputProps": { ... },
      "editableFields": ["titleText", "titleColor", ...]
    }
  ]
}</pre>
          </div>

          <div class="card">
            <h3 style="margin:0 0 8px;">POST /api/renders</h3>
            <p class="muted">创建新的视频渲染任务</p>
            <div style="margin-top:10px;"><strong>请求参数</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "templateId": "hello-world",
  "inputProps": {
    "titleText": "测试标题",
    "titleColor": "#FF0000"
  }
}</pre>
            <div style="margin-top:10px;"><strong>响应示例</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "success": true,
  "code": "SUCCESS",
  "message": "渲染任务创建成功",
  "data": {
    "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "queued"
  }
}</pre>
            <div style="margin-top:10px;"><strong>错误码</strong></div>
            <ul style="font-size:13px;color:#6b7280;margin:6px 0;">
              <li><code>INVALID_REQUEST</code> - 请求参数不合法</li>
              <li><code>TEMPLATE_NOT_FOUND</code> - 模板不存在</li>
            </ul>
          </div>

          <div class="card">
            <h3 style="margin:0 0 8px;">POST /api/renders/sync</h3>
            <p class="muted">同步等待渲染完成，直接返回视频路径（适合短视频或内部调用）</p>
            <div style="margin-top:10px;"><strong>请求参数</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "templateId": "zoom-pulse",
  "inputProps": {
    "imageUrl": "https://example.com/demo.jpg",
    "minScale": 1,
    "maxScale": 1.1
  },
  "timeoutMs": 300000
}</pre>
            <div style="margin-top:10px;"><strong>成功响应示例</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "success": true,
  "code": "SUCCESS",
  "message": "渲染完成",
  "data": {
    "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "completed",
    "videoUrl": "http://localhost:1572/renders/xxx.mp4",
    "elapsedMs": 38920
  }
}</pre>
            <div style="margin-top:10px;"><strong>说明</strong></div>
            <ul style="font-size:13px;color:#6b7280;margin:6px 0;">
              <li><code>timeoutMs</code> 范围: 1000 ~ 900000</li>
              <li>超时会返回 202，建议改用异步接口继续轮询</li>
              <li>高并发场景建议优先使用异步接口</li>
            </ul>
          </div>

          <div class="card">
            <h3 style="margin:0 0 8px;">GET /api/renders/:jobId</h3>
            <p class="muted">查询任务状态和进度</p>
            <div style="margin-top:10px;"><strong>响应示例（进行中）</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "success": true,
  "code": "SUCCESS",
  "message": "获取任务状态成功",
  "data": {
    "status": "in-progress",
    "progress": 0.65,
    "elapsedMs": 12345,
    "data": { "templateId": "hello-world", ... }
  }
}</pre>
            <div style="margin-top:10px;"><strong>响应示例（完成）</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "success": true,
  "code": "SUCCESS",
  "message": "获取任务状态成功",
  "data": {
    "status": "completed",
    "videoUrl": "http://localhost:1572/renders/xxx.mp4",
    "elapsedMs": 45231,
    "data": { ... }
  }
}</pre>
          </div>

          <div class="card">
            <h3 style="margin:0 0 8px;">DELETE /api/renders/:jobId</h3>
            <p class="muted">取消正在执行的任务</p>
            <div style="margin-top:10px;"><strong>响应示例</strong></div>
            <pre style="background:#f9fafb;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto;">{
  "success": true,
  "code": "SUCCESS",
  "message": "任务取消成功",
  "data": {
    "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}</pre>
            <div style="margin-top:10px;"><strong>错误码</strong></div>
            <ul style="font-size:13px;color:#6b7280;margin:6px 0;">
              <li><code>JOB_NOT_FOUND</code> - 任务不存在</li>
              <li><code>JOB_NOT_CANCELLABLE</code> - 任务状态不可取消</li>
            </ul>
          </div>

          <div class="card">
            <h3 style="margin:0 0 8px;">完整错误码列表</h3>
            <ul style="font-size:13px;color:#6b7280;margin:6px 0;">
              <li><code>SUCCESS</code> - 成功</li>
              <li><code>INVALID_REQUEST</code> - 请求参数不合法</li>
              <li><code>TEMPLATE_NOT_FOUND</code> - 模板不存在</li>
              <li><code>JOB_NOT_FOUND</code> - 任务不存在</li>
              <li><code>JOB_NOT_CANCELLABLE</code> - 任务不可取消</li>
              <li><code>INTERNAL_ERROR</code> - 服务器内部错误</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  `,
}).mount("#app");

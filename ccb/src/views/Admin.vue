<template>
  <div class="admin-panel">
    <h2>管理员：用户列表</h2>
    <p v-if="loading">正在加载用户数据...</p>
    <p v-else-if="error">{{ error }}</p>

    <ul v-else class="user-list">
      <li v-for="user in users" :key="user.uID" class="user-item">
        <img :src="user.uAvatar" alt="Avatar" class="user-avatar">
        <div class="user-info">
          <strong>{{ user.uName }}</strong> (ID: {{ user.uID }})
        </div>
        
        <button 
          @click="deleteUser(user.uID, user.uName)" 
          :disabled="deletingUserId === user.uID"
          class="delete-btn"
        >
          {{ deletingUserId === user.uID ? '删除中...' : '删除' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';

// --------------------------- 响应式状态 ---------------------------
const users = ref([]); // 存储从后端获取的用户列表
const loading = ref(true); // 初始加载状态
const error = ref(null); // 错误信息
const deletingUserId = ref(null); // 正在删除的用户 ID，用于禁用按钮

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
const token = localStorage.getItem('token');

// --------------------------- 数据获取函数 ---------------------------
const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
        const res = await axios.get(`${VITE_BASE_URL}/admin/getUsers`, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        
        // 假设后端返回的数据结构是 { message: '...', users: [...] }
        users.value = res.data.users || []; 
        
    } catch (err) {
        console.error("获取用户列表失败:", err);
        error.value = '无法加载用户数据，请检查网络或后端。';
    } finally {
        loading.value = false;
    }
};

// --------------------------- 删除用户函数 ---------------------------
const deleteUser = async (uID, uName) => {
    if (!confirm(`确定要删除用户 "${uName}" (ID: ${uID}) 吗？`)) {
        return; // 用户取消
    }

    deletingUserId.value = uID; // 设置删除状态
    
    try {
        // 调用后端删除接口
        await axios.post(`${VITE_BASE_URL}/admin/delUsers`, { uID }, {
            headers: {
                authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 删除成功后，更新前端列表 (从 users 数组中移除被删除的用户)
        users.value = users.value.filter(user => user.uID !== uID);

        alert(`用户 ${uName} 删除成功！`);
        
    } catch (err) {
        console.error(`删除用户 ${uID} 失败:`, err);
        // 根据后端状态码提供更准确的错误提示
        const msg = err.response?.data?.message || '删除操作失败，请查看控制台。';
        alert(`删除失败: ${msg}`);

    } finally {
        deletingUserId.value = null; // 无论成功失败，都清除删除状态
    }
};

// --------------------------- 生命周期钩子 ---------------------------
onMounted(() => {
    // 组件挂载后立即获取数据
    fetchUsers();
});
</script>

<style scoped>
/* 简单的 CSS 样式，您可以根据需要进行调整 */
.admin-panel {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
}
.user-list {
    list-style: none;
    padding: 0;
}
.user-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
    margin-bottom: 5px;
}
.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 15px;
}
.user-info {
    flex-grow: 1;
}
.delete-btn {
    padding: 5px 10px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.delete-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>
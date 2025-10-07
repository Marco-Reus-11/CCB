<template>
  <div class="admin-panel">
    <h2>Coffee Chat Bar</h2>
    <h3 style="color: red;">Admin</h3>
    
    <p v-if="loading" style="color: #007bff; text-align: center;">
        <i class="loading-spinner"></i> 正在加载用户数据...
    </p>
    <p v-else-if="error" style="color: #dc3545; text-align: center;">
        加载失败：{{ error }}
    </p>

    <div v-else class="view-switcher">
      <button 
        @click="viewMode = 'graph'" 
        :class="{ active: viewMode === 'graph' }"
      >
        用户关系图 ({{ users.length }} 个用户)
      </button>
      <button 
        @click="viewMode = 'list'" 
        :class="{ active: viewMode === 'list' }"
      >
        用户列表管理
      </button>
    </div>

    <div v-if="viewMode === 'graph' && !loading && !error" 
         ref="chartContainer" 
         class="echarts-container">
    </div>
    
    <div v-else-if="viewMode === 'list' && !loading && !error" class="user-list-container">
      <p v-if="!users.length" style="text-align: center; color: #888; padding: 20px;">
        暂无用户数据。
      </p>
      
      <ul class="user-list">
        <li v-for="user in users" :key="user.uID" class="user-item">
          <img :src="user.uAvatar || '默认头像URL'" alt="Avatar" class="user-avatar">
          <div class="user-info">
            <strong>{{ user.uName }}</strong>
            <p>(ID: {{ user.uID }})</p>
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
  </div>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';
import axios from 'axios'; 
import * as echarts from 'echarts';

// --------------------------- 状态变量 ---------------------------
// 从你提供的代码中导入
const users = ref([]); // 存储从后端获取的用户列表
const loading = ref(true); // 初始加载状态
const error = ref(null); // 错误信息
const deletingUserId = ref(null); // 正在删除的用户 ID，用于禁用按钮

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
const token = localStorage.getItem('token');

// ECharts 相关状态
const viewMode = ref('graph'); // 默认显示关系图
const chartContainer = ref(null);
let myChart = null; 

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
        // 🚨 务必检查后端返回的用户数据结构，确保它包含 Friends 数组
        users.value = res.data.users || []; 
        
        // 移除或修改这个 alert，它会阻塞 UI
        // alert('返回的数据：', users.value); 
        console.log('用户数据获取成功:', users.value.length, '条');
        
        // 数据更新后，如果当前是关系图模式，需立即更新图表
        if (viewMode.value === 'graph') {
             nextTick(initChart); 
        }
        
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
        return; 
    }

    deletingUserId.value = uID; 
    
    try {
        await axios.post(`${VITE_BASE_URL}/admin/delUsers`, { uID }, {
            headers: {
                authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 删除成功后，更新前端列表 (从 users 数组中移除被删除的用户)
        users.value = users.value.filter(user => user.uID !== uID);

        alert(`用户 ${uName} 删除成功！`);
        
        // ❗ 关系图模式下也需要更新图表
        if (viewMode.value === 'graph') {
            nextTick(initChart);
        }
        
    } catch (err) {
        console.error(`删除用户 ${uID} 失败:`, err);
        const msg = err.response?.data?.message || '删除操作失败，请查看控制台。';
        alert(`删除失败: ${msg}`);

    } finally {
        deletingUserId.value = null; 
    }
};

// --------------------------- ECharts 初始化函数 ---------------------------
const initChart = () => {
  // 仅在数据加载成功且容器存在时才初始化
  if (!chartContainer.value || !users.value.length || loading.value || error.value) {
    if (myChart) myChart.dispose(); // 如果有旧图表，先销毁
    return; 
  }

  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(chartContainer.value);

  // 准备 ECharts 需要的数据格式
  // 注意：这里假设从后端获取的 users 数组结构与之前的假数据兼容，即包含 uID, uName, uAvatar, Friends 字段。
  const nodes = users.value.map(user => ({
    id: user.uID,
    name: user.uName,
    
    // 使用图片作为节点
    symbol: 'image://' + user.uAvatar, 
    symbolSize: [60, 60], 
    
    itemStyle: {
      borderColor: '#fff',
      borderWidth: 2,
    },
    category: 0 
  }));

  const links = users.value.flatMap(user =>
    (user.Friends || []).map(friend => ({ 
      // 必须确保 friend 对象中有 uID 字段
      source: user.uID,
      target: friend.uID,
      value: 1 
    }))
  );

  const option = {
    title: {
      text: '用户关系网络',
      subtext: `共 ${users.value.length} 个用户`,
      left: 'center',
      top: 20
    },
    tooltip: {
      formatter: '{b}' 
    },
    legend: [
      {
        data: ['用户'], 
        selectedMode: false 
      }
    ],
    series: [
      {
        name: '用户关系',
        type: 'graph',
        layout: 'force', 
        roam: true,      
        label: {
          show: true,
          position: 'right', 
          formatter: '{b}',
          color: '#333' 
        },
        force: {
          repulsion: 1500,  
          edgeLength: [100, 200] 
        },
        data: nodes,
        links: links,
        categories: [
          { name: '用户', itemStyle: { color: '#6a7985' } } 
        ],
        lineStyle: {
          color: '#ccc', 
          curveness: 0.1 
        },
        emphasis: { 
          focus: 'adjacency', 
          lineStyle: {
            width: 5
          }
        }
      }
    ]
  };

  myChart.setOption(option);

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    myChart?.resize();
  });
};

// --------------------------- 生命周期和监听 ---------------------------

onMounted(() => {
  // 组件挂载后立即获取数据
  fetchUsers();
});

// 监听 viewMode 变化
watch(viewMode, (newMode) => {
  if (newMode === 'graph') {
    // 切换到关系图时，等待 DOM 渲染完成后再初始化图表
    nextTick(initChart);
  } else if (myChart) {
    // 切换到列表时，销毁图表实例以释放内存
    myChart.dispose();
    myChart = null;
  }
});
</script>

<style scoped>
.admin-panel {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 20px auto;
  text-align: center;
  width: 80vw;
  height: 90vh;      
  padding-bottom: 10vh;
  /* overflow: hidden; */
}

h2, h3 {
  color: #333;
}

.view-switcher {
  margin-bottom: 20px;
}

.view-switcher button {
  padding: 10px 15px;
  margin: 0 5px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-switcher button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

/* 关系图容器 */
.echarts-container {
  width: 100%;
  height: 80%; /* 调整高度以适应容器 */
  background-color: #fff;
  border-radius: 8px;
  margin-top: 20px;
}

/* 用户列表样式 */
.user-list-container {
  max-height: 80%; /* 控制列表高度 */
  overflow-y: auto;
  background-color: #fff;
  padding: 10px;
  border-radius: 8px;
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}

.user-info {
  flex-grow: 1;
  text-align: left;
}

.delete-btn {
  padding: 8px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
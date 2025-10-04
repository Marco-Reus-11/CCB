<template>
    <!-- <input type="file" name="" id="" accept="image/*" @change="onFileUpload">
    <button @click="addImg">保留图片</button>
    <button @click="minusImg">删减图片</button>
    <button @click="clearImg">清空图片</button> -->
    <!-- <div v-if="imgURL"> -->
    <!-- <div class="Pics">
        <img v-for="imgURL in imgURLs" :src="imgURL" alt="缩略图" class="pics">
    </div> -->
    <!-- <div class="cards">
        <li class="card">卡片</li>
    </div>
    <div class="triangle"></div> -->
    <VideoBackground/>
</template>

<script setup>
import { ref } from 'vue';
import VideoBackground from '../components/VideoBackground.vue'

const imgFile = ref(null)
const imgURL = ref("")
const imgURLs = ref([])

function onFileUpload(e){
    const file = e.target.files[0]
    if(!file)return
    if(file.type.startsWith("image/")){
        imgFile.value = file
        imgURL.value = URL.createObjectURL(file)
        console.log(`文件${e.target.files[0].name}的格式为${e.target.files[0].type}`)
    }
    }

function addImg(){
    if(!imgURL.value)return
    if(imgURLs.value.length<16){
        imgURLs.value.push(imgURL.value)
    }
}

function minusImg(){
    if(!imgURL.value)return
    imgURLs.value.pop()
}

function clearImg(){
    imgURLs.value.length = 0
}
</script>

<style scoped>
    button{
        margin-top: 10px;
        height: 50px;
        min-width: fit-content;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.5s ease;
    }
    button:hover{
        scale: 1.05;
    }
.Pics {
  display: grid;
  height: 100vh;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 5px;
  border: 1px solid black;
}

.pics {
    width: 100%;
    height: 100%;
    object-fit: cover;
  border: 1px solid black;
  box-sizing: border-box;
}

.cards{
    margin: 5px;
    list-style-type: none;
    text-decoration: none;
}
.card{
    border: 1px solid black;
}
.card::after{
    content: "伪元素";
}
/* .triangle{
    height: 0;
    width: 0;
    border-left: 50px solid transparent;
    border-right: 50px solid transparent;
    border-bottom: 100px solid black;
} */
.triangle{
    width: 500px;
    height: 500px;
    background: linear-gradient(to left bottom,white 50%,black 50%);
}
</style>
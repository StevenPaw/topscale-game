import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '../vue/router'
import App from '../vue/App.vue'
import '../scss/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

document.addEventListener("DOMContentLoaded", function (event) {

    // INIT MENUBUTTON
    const menu_button = document.querySelector('[data-behaviour="toggle-menu"]');
    if(menu_button) {
        menu_button.addEventListener('click', () => {
            document.body.classList.toggle('body--show');
        });
    }
});

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEditModeStore = defineStore('editMode', () => {
    const isEditMode = ref(false)
    const editingComponent = ref(null)

    const enableEditMode = (component = null) => {
        isEditMode.value = true
        editingComponent.value = component
    }

    const disableEditMode = () => {
        isEditMode.value = false
        editingComponent.value = null
    }

    const toggleEditMode = (component = null) => {
        if (isEditMode.value) {
            disableEditMode()
        } else {
            enableEditMode(component)
        }
    }

    return {
        isEditMode,
        editingComponent,
        enableEditMode,
        disableEditMode,
        toggleEditMode
    }
})

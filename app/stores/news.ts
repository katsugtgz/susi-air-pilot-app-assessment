/**
 * News store — exposes the news feed from mock-news.json.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import newsData from '~/assets/data/mock-news.json'
import type { NewsItem } from '~/types'

export const useNewsStore = defineStore('news', () => {
  const items = ref<NewsItem[]>(newsData.items)
  return { items }
})

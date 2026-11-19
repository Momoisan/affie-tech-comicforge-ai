import type { UILanguage } from '@/types/comicforge';

export interface Translations {
  brand: {
    name: string;
    appName: string;
    tagline: string;
    noticeNoInternalImages: string;
  };
  nav: {
    dashboard: string;
    creator: string;
    characters: string;
    storyBible: string;
    director: string;
    packageStudio: string;
    prompts: string;
    projects: string;
    settings: string;
  };
  actions: {
    createComic: string;
    createCharacter: string;
    generateStory: string;
    generatePrompt: string;
    generateRefPrompt: string;
    copyPrompt: string;
    copyImagePrompt: string;
    copyNegativePrompt: string;
    copyJson: string;
    downloadTxt: string;
    downloadJson: string;
    saveProject: string;
    saveCharacter: string;
    savePrompt: string;
    continueProject: string;
    edit: string;
    duplicate: string;
    archive: string;
    delete: string;
    regenerate: string;
    openChatGPT: string;
    openGemini: string;
    cancel: string;
    confirm: string;
  };
  dashboard: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    recentProjects: string;
    savedCharacters: string;
    recentPrompts: string;
    engineStatus: string;
    quickStartTitle: string;
    quickStartSubtitle: string;
    emptyProjects: string;
    emptyCharacters: string;
    emptyPrompts: string;
    workflowSteps: { title: string; desc: string }[];
  };
  creator: {
    title: string;
    subtitle: string;
    steps: string[];
    selectStyle: string;
    selectEngine: string;
    autoGenerateTitle: string;
    expandIdea: string;
    advancedControls: string;
    presetChatGPT: string;
    presetGemini: string;
    formatA: string;
    formatB: string;
    fallbackNotice: string;
    geminiOnlyError: string;
  };
  characters: {
    title: string;
    subtitle: string;
    identityTab: string;
    appearanceTab: string;
    outfitTab: string;
    lockTab: string;
    libraryTitle: string;
    searchPlaceholder: string;
    lockNote: string;
    uploadRefLabel: string;
    uploadRefHint: string;
  };
  prompts: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    empty: string;
  };
  projects: {
    title: string;
    subtitle: string;
    newProject: string;
    empty: string;
    confirmDelete: string;
  };
  settings: {
    title: string;
    subtitle: string;
    interfaceLanguage: string;
    themeMode: string;
    preferredEngine: string;
    defaultStyle: string;
    defaultAspectRatio: string;
    exportTarget: string;
    savedToast: string;
    accountTitle: string;
  };
}

export const TRANSLATIONS: Record<UILanguage, Translations> = {
  'ms-MY': {
    brand: {
      name: 'AFFIE TECH',
      appName: 'ComicForge AI',
      tagline: 'Dari Imaginasi ke Penciptaan Komik.',
      noticeNoInternalImages:
        'ComicForge AI menjana cerita, watak & prompt imej berstruktur. Salin prompt ke ChatGPT Images atau Google Gemini untuk menjana gambar komik anda secara luaran.',
    },
    nav: {
      dashboard: 'Papan Pemuka',
      creator: 'Cipta Komik',
      characters: 'Studio Watak',
      storyBible: 'Story Universe Studio',
      director: 'Pengarah Panel',
      packageStudio: 'Studio Pakej Prompt',
      prompts: 'Pustaka Prompt',
      projects: 'Projek Saya',
      settings: 'Tetapan',
    },
    actions: {
      createComic: 'Cipta Komik',
      createCharacter: 'Cipta Watak',
      generateStory: 'Jana Cerita',
      generatePrompt: 'Jana Prompt',
      generateRefPrompt: 'Jana Prompt Rujukan Watak',
      copyPrompt: 'Salin Prompt',
      copyImagePrompt: 'Salin Prompt Imej Sahaja',
      copyNegativePrompt: 'Salin Negative Prompt',
      copyJson: 'Salin JSON',
      downloadTxt: 'Muat Turun TXT',
      downloadJson: 'Muat Turun JSON',
      saveProject: 'Simpan Projek',
      saveCharacter: 'Simpan Watak',
      savePrompt: 'Simpan Prompt',
      continueProject: 'Sambung Projek',
      edit: 'Sunting',
      duplicate: 'Salin / Duplikat',
      archive: 'Arkibkan',
      delete: 'Padam',
      regenerate: 'Jana Semula',
      openChatGPT: 'Buka ChatGPT',
      openGemini: 'Buka Gemini',
      cancel: 'Batal',
      confirm: 'Sahkan',
    },
    dashboard: {
      welcomeTitle: 'Selamat Datang ke AFFIE TECH ComicForge AI',
      welcomeSubtitle:
        'Platform khas untuk merancang cerita komik, mengunci identiti watak, dan menjana prompt panel yang sedia disalin ke ChatGPT Images atau Google Gemini.',
      recentProjects: 'Projek Terkini',
      savedCharacters: 'Watak Tersimpan',
      recentPrompts: 'Prompt Terkini',
      engineStatus: 'Status Engine AI',
      quickStartTitle: 'Panduan Pantas 10 Langkah (Aliran Kerja Luaran)',
      quickStartSubtitle:
        'ComicForge AI tidak menjana gambar secara dalaman. Ikuti 10 langkah mudah ini untuk hasil komik yang konsisten:',
      emptyProjects: 'Belum ada projek komik. Klik "Cipta Komik" untuk mula membina cerita pertama anda.',
      emptyCharacters: 'Belum ada watak tersimpan. Klik "Cipta Watak" untuk membina profil watak pertama anda.',
      emptyPrompts: 'Belum ada prompt dijana. Jana prompt cerita atau rujukan watak untuk menyimpannya di sini.',
      workflowSteps: [
        { title: '1. Cipta Cerita Komik', desc: 'Tetapkan tajuk, genre, premis, dan nada cerita anda.' },
        { title: '2. Cipta atau Pilih Watak', desc: 'Bina profil watak di Studio Watak dan aktifkan Kunci Identiti.' },
        { title: '3. Jana Prompt Rujukan Watak', desc: 'Hasilkan prompt helaian rujukan (depan, sisi, 3/4, badan penuh).' },
        { title: '4. Jana Gambar Rujukan Luaran', desc: 'Salin prompt rujukan ke ChatGPT atau Gemini untuk dapatkan gambar watak.' },
        { title: '5. Muat Naik Gambar Rujukan', desc: 'Simpan gambar rujukan itu pada profil watak di ComicForge sebagai panduan visual.' },
        { title: '6. Jana Prompt Episod & Panel', desc: 'Gunakan Cipta Komik untuk menjana pecahan episod, babak, dan panel.' },
        { title: '7. Salin Prompt Panel', desc: 'Pilih preset ChatGPT Images atau Gemini dan salin prompt panel.' },
        { title: '8. Lampirkan Rujukan Watak', desc: 'Muat naik gambar rujukan watak di ChatGPT/Gemini jika disokong.' },
        { title: '9. Jana Gambar Komik', desc: 'Jana ilustrasi panel komik anda di perkhidmatan AI imej pilihan.' },
        { title: '10. Simpan Nota & Prompt', desc: 'Rekodkan prompt dan nota penjanaan dalam projek ComicForge anda.' },
      ],
    },
    creator: {
      title: 'Pencipta Komik (Comic Creator)',
      subtitle: 'Ikuti 4 langkah berpandu untuk menjana skrip episod dan prompt panel komik yang tersusun.',
      steps: ['1. Maklumat Projek', '2. Gaya Komik', '3. Format & Had', '4. Jana Cerita & Panel'],
      selectStyle: 'Pilih Gaya Komik',
      selectEngine: 'Pilih Engine AI',
      autoGenerateTitle: 'Jana Tajuk Automatik',
      expandIdea: 'Kembangkan Idea',
      advancedControls: 'Tetapan Prompt Lanjutan',
      presetChatGPT: 'Preset ChatGPT Images',
      presetGemini: 'Preset Google Gemini',
      formatA: 'Format A — Prompt Mudah Baca',
      formatB: 'Format B — JSON Berstruktur',
      fallbackNotice: 'Mod Auto: Engine Tempatan digunakan sebagai sandaran kerana Gemini tidak tersedia atau kuota tamat.',
      geminiOnlyError: 'Mod Gemini Sahaja gagal menghubungi pelayan Gemini. Sila cuba lagi atau tukar ke Mod Auto / Tempatan.',
    },
    characters: {
      title: 'Studio Watak (Character Studio)',
      subtitle: 'Reka watak boleh guna semula dengan Kunci Identiti dan Prompt Helaian Rujukan.',
      identityTab: 'Identiti',
      appearanceTab: 'Rupa Fizikal',
      outfitTab: 'Pakaian & Gaya',
      lockTab: 'Kunci Identiti & Rujukan',
      libraryTitle: 'Pustaka Watak',
      searchPlaceholder: 'Cari nama, kod atau peranan watak...',
      lockNote:
        'Kunci Identiti membantu mengekalkan ciri tetap watak dalam setiap prompt, namun hasil akhir masih bergantung kepada model imej luaran.',
      uploadRefLabel: 'Muat Naik Gambar Rujukan (Bantuan Visual)',
      uploadRefHint: 'PNG, JPG atau WebP (maksimum 5MB). Disimpan sebagai rujukan visual watak.',
    },
    prompts: {
      title: 'Pustaka Prompt (Prompt Library)',
      subtitle: 'Cari, tapis, salin dan eksport semua prompt komik serta helaian rujukan watak anda.',
      searchPlaceholder: 'Cari prompt mengikut tajuk, watak atau gaya...',
      filterAll: 'Semua Jenis',
      empty: 'Tiada prompt ditemui. Jana cerita atau rujukan watak untuk mengisi pustaka ini.',
    },
    projects: {
      title: 'Projek Saya (My Projects)',
      subtitle: 'Urus, salin, arkibkan atau sambung projek komik anda bila-bila masa.',
      newProject: 'Projek Baharu',
      empty: 'Anda belum mempunyai sebarang projek. Mulakan di Pencipta Komik.',
      confirmDelete: 'Padam projek ini? Watak yang dikongsi di Studio Watak tidak akan dipadam.',
    },
    settings: {
      title: 'Tetapan Aplikasi',
      subtitle: 'Sesuaikan bahasa antara muka, tema, engine AI lalai, dan pilihan eksport.',
      interfaceLanguage: 'Bahasa Antara Muka',
      themeMode: 'Tema Paparan',
      preferredEngine: 'Engine AI Pilihan',
      defaultStyle: 'Gaya Komik Lalai',
      defaultAspectRatio: 'Nisbah Aspek Lalai',
      exportTarget: 'Sasaran Eksport Prompt Lalai',
      savedToast: 'Tetapan berjaya disimpan.',
      accountTitle: 'Status Akaun & Penyimpanan',
    },
  },
  en: {
    brand: {
      name: 'AFFIE TECH',
      appName: 'ComicForge AI',
      tagline: 'From Imagination to Comic Creation.',
      noticeNoInternalImages:
        'ComicForge AI generates structured stories, character sheets & image prompts. Copy prompts into ChatGPT Images or Google Gemini to generate images externally.',
    },
    nav: {
      dashboard: 'Dashboard',
      creator: 'Comic Creator',
      characters: 'Character Studio',
      storyBible: 'Story Universe Studio',
      director: 'Smart Panel Director',
      packageStudio: 'Prompt Package Studio',
      prompts: 'Prompt Library',
      projects: 'My Projects',
      settings: 'Settings',
    },
    actions: {
      createComic: 'Create New Comic',
      createCharacter: 'Create New Character',
      generateStory: 'Generate Story',
      generatePrompt: 'Generate Prompt',
      generateRefPrompt: 'Generate Character Reference Prompt',
      copyPrompt: 'Copy Full Prompt',
      copyImagePrompt: 'Copy Image Prompt Only',
      copyNegativePrompt: 'Copy Negative Prompt',
      copyJson: 'Copy JSON',
      downloadTxt: 'Download TXT',
      downloadJson: 'Download JSON',
      saveProject: 'Save Project',
      saveCharacter: 'Save Character',
      savePrompt: 'Save Prompt',
      continueProject: 'Continue Project',
      edit: 'Edit',
      duplicate: 'Duplicate',
      archive: 'Archive',
      delete: 'Delete',
      regenerate: 'Regenerate',
      openChatGPT: 'Open ChatGPT',
      openGemini: 'Open Gemini',
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
    dashboard: {
      welcomeTitle: 'Welcome to AFFIE TECH ComicForge AI',
      welcomeSubtitle:
        'A dedicated platform to plan comic stories, lock character identities, and generate structured panel prompts ready for ChatGPT Images or Google Gemini.',
      recentProjects: 'Recent Projects',
      savedCharacters: 'Saved Characters',
      recentPrompts: 'Recent Generated Prompts',
      engineStatus: 'AI Engine Status',
      quickStartTitle: 'Quick Start 10-Step External Image Workflow',
      quickStartSubtitle:
        'ComicForge AI does not generate images internally. Follow these 10 steps for consistent comic panels:',
      emptyProjects: 'No comic projects yet. Click "Create New Comic" to start your first story.',
      emptyCharacters: 'No saved characters yet. Click "Create New Character" to build your first character profile.',
      emptyPrompts: 'No generated prompts yet. Generate a story or character reference prompt to save it here.',
      workflowSteps: [
        { title: '1. Create Comic Story', desc: 'Set your title, genre, premise, and story tone.' },
        { title: '2. Create or Select Characters', desc: 'Build character profiles in Character Studio with Identity Lock.' },
        { title: '3. Generate Reference Prompts', desc: 'Create a multi-view reference sheet prompt (front, 3/4, side, full-body).' },
        { title: '4. Generate External Reference', desc: 'Copy the reference prompt into ChatGPT or Gemini to create the character sheet.' },
        { title: '5. Upload Reference Image', desc: 'Attach the generated reference image to the character in ComicForge as a visual aid.' },
        { title: '6. Generate Episode & Panel Prompts', desc: 'Use Comic Creator to generate structured episodes, scenes, and panels.' },
        { title: '7. Copy Panel Prompt', desc: 'Choose the ChatGPT Images or Gemini preset and copy the panel prompt.' },
        { title: '8. Attach Character Reference', desc: 'Attach the character reference image in the external image service where supported.' },
        { title: '9. Generate Comic Image', desc: 'Generate your comic panel illustration in your chosen external AI tool.' },
        { title: '10. Save Prompt & Notes', desc: 'Store the panel prompt and generation notes inside your ComicForge project.' },
      ],
    },
    creator: {
      title: 'Comic Creator',
      subtitle: 'Follow the 4-step guided workflow to generate structured episode scripts and comic panel prompts.',
      steps: ['1. Project Info', '2. Art Style', '3. Format & Limits', '4. Story & Panels'],
      selectStyle: 'Select Comic Style',
      selectEngine: 'Select AI Engine',
      autoGenerateTitle: 'Auto-Generate Title',
      expandIdea: 'Expand Idea',
      advancedControls: 'Advanced Prompt Controls',
      presetChatGPT: 'ChatGPT Images Preset',
      presetGemini: 'Google Gemini Preset',
      formatA: 'Format A — Human-Readable Prompt',
      formatB: 'Format B — Structured JSON',
      fallbackNotice: 'Auto Mode: Local Prompt Engine was used as fallback because Gemini was unavailable or quota was reached.',
      geminiOnlyError: 'Gemini Only mode could not complete the request. Please try again or switch to Auto / Local Only.',
    },
    characters: {
      title: 'Character Studio',
      subtitle: 'Design reusable characters with Identity Lock and multi-view Reference Sheet prompts.',
      identityTab: 'Identity',
      appearanceTab: 'Physical Appearance',
      outfitTab: 'Outfit & Style',
      lockTab: 'Identity Lock & Reference',
      libraryTitle: 'Character Library',
      searchPlaceholder: 'Search by character name, code, or role...',
      lockNote:
        'Character locking is a consistency aid across prompts, not a guarantee that external image models will reproduce identical faces.',
      uploadRefLabel: 'Upload Reference Image (Visual Aid)',
      uploadRefHint: 'PNG, JPG, or WebP (max 5MB). Stored as a visual aid for your character profile.',
    },
    prompts: {
      title: 'Prompt Library',
      subtitle: 'Search, filter, copy, and export your generated comic panel and character reference prompts.',
      searchPlaceholder: 'Search prompts by title, character, or style...',
      filterAll: 'All Types',
      empty: 'No prompts found. Generate a story or character reference prompt to populate this library.',
    },
    projects: {
      title: 'My Projects',
      subtitle: 'Create, edit, duplicate, archive, or continue your comic projects anytime.',
      newProject: 'New Project',
      empty: 'You do not have any projects yet. Start in Comic Creator.',
      confirmDelete: 'Delete this project? Shared characters in Character Studio will NOT be deleted.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Configure interface language, theme, preferred AI engine, default style, and export preferences.',
      interfaceLanguage: 'Interface Language',
      themeMode: 'Theme',
      preferredEngine: 'Preferred AI Engine',
      defaultStyle: 'Default Comic Style',
      defaultAspectRatio: 'Default Aspect Ratio',
      exportTarget: 'Default Export Target',
      savedToast: 'Settings saved successfully.',
      accountTitle: 'Account & Persistence Status',
    },
  },
};

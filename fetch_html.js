import axios from 'axios';
import fs from 'fs';

const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U1ZTdlYzY5ZjczNjQ1YTJiMzlmYjczYWEzNDM4MmJlEgsSBxCd3d_9jRcYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDIzNjA2NDUwMzI3Mjk5NTY5OA&filename=&opi=89354086";

async function download() {
    console.log('Downloading...');
    try {
        const response = await axios.get(url, { responseType: 'text' });
        fs.writeFileSync('temp_candidates.html', response.data);
        console.log('Success');
    } catch(err) {
        console.error(err.message);
    }
}

download();

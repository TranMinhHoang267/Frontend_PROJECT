# Sử dụng image node 20 làm base
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy các file package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Copy toàn bộ code vào container
COPY . .

# Expose port mặc định của Vite (5173)
EXPOSE 5173

# Chạy ở chế độ develop (truyền host để truy cập từ ngoài container)
CMD ["npm", "run", "dev", "--", "--host"]

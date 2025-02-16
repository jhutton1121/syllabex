# SYLLABEX/frontend/Dockerfile

# 1. Use an official Node image
FROM node:23-alpine

# 2. Create and set the working directory
WORKDIR /app

# 3. Copy package.json and lock files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the entire Next.js codebase
COPY . .

# 6. Expose port 3000 for Next.js
EXPOSE 3000

# 7. Run Next.js in development mode
CMD ["npm", "run", "dev"]

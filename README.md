# GetFileFromDriveTool

### Hướng dẫn sử dụng tool
1. Tải nodeJS

2. Clone Project

3. Mở terminal tại thư mục, gõ lệnh `npm i`

4. Tải file json do Drive API cung cấp, đặt tên là `credentials.json` trong thư mục (ngang hàng file `search.js` và `getFiles.js`)

5. Mở file `search.js`, đổi biến `NAME_TO_SEARCH` tại dòng số 8 thành tên thư mục muốn lấy file

6. Gõ lệnh `node search.js`, copy giá trị `id` được trả về ở terminal. (Nếu có yêu cầu đăng nhập thì đăng nhập)

7. Mở file `getFiles.js`, đổi biến `ID_TO_GET_FILES` tại dòng số 9 thành id vừa lấy được ở bước 6

8. Gõ lệnh `node getFiles.js`, kiên nhẫn đợi đến khi chạy xong

9. Mở file result.json

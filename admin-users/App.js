// THƯ VIỆN: React, React Native, Expo và kiểm tra dữ liệu nhập.
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { validateUser } from './src/validation';

// CẤU HÌNH API: lấy địa chỉ server từ .env; bỏ dấu / cuối để ghép đường dẫn.
const API = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000').replace(
  /\/$/,
  '',
);
// 4 trường dữ liệu
const blank = { hoten: '', email: '', matkhau: '', hinhanh: '' };
// 01. HIỆU ỨNG NÚT: xử lý rê chuột, focus bàn phím và nhấn trên điện thoại.
// Màu hover truyền qua hoverStyle/hoverTextStyle; tốc độ nằm trong hoverStyles cuối file.
function HoverButton({
  title,
  style,
  textStyle,
  hoverStyle,
  hoverTextStyle,
  disabled = false,
  ...props
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = (pressed) => !disabled && (hovered || focused || pressed);
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        style,
        Platform.OS === 'web' && hoverStyles.transition,
        active(pressed) && hoverStyle,
        pressed && !disabled && hoverStyles.pressed,
        disabled && hoverStyles.disabled,
        Platform.OS === 'web' && { cursor: disabled ? 'not-allowed' : 'pointer' },
      ]}
    >
      {({ pressed }) => (
        <Text
          style={[
            textStyle,
            Platform.OS === 'web' && hoverStyles.textTransition,
            active(pressed) && hoverTextStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

// 02. BẢNG NGƯỜI DÙNG: tìm kiếm, danh sách, nút Thêm / Sửa / Xóa và phân trang.
// Màn hình nhỏ hiển thị email dưới hoten; chỉnh giao diện tại tableStyles cuối file.
function UserDirectory({
  data,
  search,
  onSearch,
  page,
  onPage,
  loading,
  busy,
  notice,
  error,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 680;
  return (
    <View style={tableStyles.directory}>
      {/* Thanh công cụ: tổng số người dùng, ô tìm kiếm và nút Thêm. */}
      <View style={[tableStyles.toolbar, compact && tableStyles.toolbarCompact]}>
        <View style={tableStyles.heading}>
          <Text style={tableStyles.title}>Tất cả người dùng</Text>
          <Text style={tableStyles.count}>{data.total}</Text>
        </View>
        <View style={[tableStyles.controls, compact && tableStyles.controlsCompact]}>
          <View style={tableStyles.searchBox}>
            <Text style={tableStyles.searchIcon}>⌕</Text>
            <TextInput
              accessibilityLabel="Tìm họ tên hoặc email"
              placeholder="Tìm kiếm…"
              placeholderTextColor="#98a2b3"
              value={search}
              onChangeText={onSearch}
              autoCapitalize="none"
              style={tableStyles.searchInput}
            />
          </View>
          <HoverButton
            title="＋ Thêm người dùng"
            disabled={busy}
            onPress={onAdd}
            style={tableStyles.addButton}
            textStyle={tableStyles.addText}
            hoverStyle={tableStyles.addHover}
            hoverTextStyle={tableStyles.whiteText}
          />
        </View>
      </View>
      {/* Thông báo thành công hoặc lỗi tải dữ liệu. */}
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={tableStyles.success}>
          {notice}
        </Text>
      )}
      {!!error && (
        <View style={tableStyles.errorBox}>
          <Text accessibilityRole="alert" style={tableStyles.error}>
            {error}
          </Text>
          <Pressable accessibilityRole="button" onPress={onRefresh}>
            <Text style={tableStyles.retry}>Thử tải lại</Text>
          </Pressable>
        </View>
      )}
      {/* Bảng dữ liệu: tiêu đề cột và các hàng người dùng. */}
      <View style={tableStyles.table}>
        <View style={tableStyles.tableHead}>
          <Text
            style={[
              tableStyles.columnLabel,
              tableStyles.nameColumn,
              compact && tableStyles.mobileName,
            ]}
          >
            Họ tên{compact ? ' / Email' : ''}
          </Text>
          {!compact && (
            <Text style={[tableStyles.columnLabel, tableStyles.emailColumn]}>Email</Text>
          )}
          <View
            style={[
              tableStyles.actionColumn,
              tableStyles.rowActions,
              !compact && tableStyles.wideActions,
            ]}
          >
            <Text
              style={[
                tableStyles.columnLabel,
                tableStyles.actionHeading,
                !compact && tableStyles.wideActionCell,
              ]}
            >
              Sửa
            </Text>
            <Text
              style={[
                tableStyles.columnLabel,
                tableStyles.actionHeading,
                !compact && tableStyles.wideActionCell,
              ]}
            >
              Xóa
            </Text>
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            accessibilityLabel="Đang tải người dùng"
            size="small"
            color="#667085"
            style={tableStyles.loader}
          />
        )}
        <FlatList
          style={tableStyles.list}
          data={data.items}
          keyExtractor={(user) => user._id}
          refreshing={loading}
          onRefresh={onRefresh}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading && !error ? (
              <View style={tableStyles.empty}>
                <Text style={tableStyles.emptyTitle}>
                  {search ? 'Không tìm thấy người dùng' : 'Chưa có người dùng'}
                </Text>
                <Text style={tableStyles.emptyDescription}>
                  {search
                    ? 'Thử tìm bằng họ tên hoặc email khác.'
                    : 'Thêm người dùng đầu tiên để bắt đầu.'}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={tableStyles.row}>
              <View
                style={[
                  tableStyles.nameColumn,
                  tableStyles.identity,
                  compact && tableStyles.mobileName,
                ]}
              >
                {item.hinhanh ? (
                  <Image
                    accessibilityLabel={`Ảnh đại diện ${item.hoten}`}
                    source={{ uri: item.hinhanh }}
                    style={tableStyles.avatar}
                  />
                ) : (
                  <View style={[tableStyles.avatar, tableStyles.avatarFallback]}>
                    <Text style={tableStyles.initial}>
                      {(item.hoten || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={tableStyles.nameText}>
                  <Text numberOfLines={1} style={tableStyles.hoten}>
                    {item.hoten}
                  </Text>
                  {compact && (
                    <Text numberOfLines={1} style={tableStyles.mobileEmail}>
                      {item.email}
                    </Text>
                  )}
                </View>
              </View>
              {!compact && (
                <Text
                  numberOfLines={1}
                  selectable
                  style={[tableStyles.emailColumn, tableStyles.email]}
                >
                  {item.email}
                </Text>
              )}
              <View
                style={[
                  tableStyles.actionColumn,
                  tableStyles.rowActions,
                  !compact && tableStyles.wideActions,
                ]}
              >
                <HoverButton
                  title="Sửa"
                  accessibilityLabel={`Sửa ${item.hoten}`}
                  disabled={busy}
                  onPress={() => onEdit(item)}
                  style={[tableStyles.editButton, !compact && tableStyles.wideActionCell]}
                  textStyle={tableStyles.editText}
                  hoverStyle={tableStyles.editHover}
                  hoverTextStyle={tableStyles.whiteText}
                />
                <HoverButton
                  title="Xóa"
                  accessibilityLabel={`Xóa ${item.hoten}`}
                  disabled={busy}
                  onPress={() => onDelete(item)}
                  style={[
                    tableStyles.deleteButton,
                    !compact && tableStyles.wideActionCell,
                  ]}
                  textStyle={tableStyles.deleteText}
                  hoverStyle={tableStyles.deleteHover}
                  hoverTextStyle={tableStyles.whiteText}
                />
              </View>
            </View>
          )}
        />
      </View>
      {/* Phân trang: chuyển trang trước/sau; vô hiệu hóa nút khi không thể chuyển. */}
      <View style={tableStyles.footer}>
        <Text style={tableStyles.pageLabel}>
          Trang {page} / {data.pages}
        </Text>
        <View style={tableStyles.pageButtons}>
          <HoverButton
            title="← Trước"
            disabled={page <= 1 || loading}
            onPress={() => onPage(page - 1)}
            style={tableStyles.pageButton}
            textStyle={tableStyles.pageButtonText}
            hoverStyle={tableStyles.pageHover}
          />
          <HoverButton
            title="Sau →"
            disabled={page >= data.pages || loading}
            onPress={() => onPage(page + 1)}
            style={tableStyles.pageButton}
            textStyle={tableStyles.pageButtonText}
            hoverStyle={tableStyles.pageHover}
          />
        </View>
      </View>
    </View>
  );
}

// 03. NÚT TRONG FORM: dùng cho đăng nhập, lưu, hủy, chọn ảnh và xác nhận xóa.
function Button({ title, onPress, secondary, danger, disabled }) {
  return (
    <HoverButton
      title={title}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, secondary && s.secondary, danger && s.danger]}
      textStyle={[s.buttonText, secondary && { color: '#334155' }]}
      hoverStyle={{
        backgroundColor: danger ? '#b91c1c' : secondary ? '#cbd5e1' : '#2563eb',
      }}
      hoverTextStyle={{ color: secondary && !danger ? '#18233b' : '#fff' }}
    />
  );
}
// 04. Ô NHẬP DÙNG CHUNG: hiển thị nhãn và TextInput cho các form.
function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#94a3b8" style={s.input} {...props} />
    </View>
  );
}
// 05. ẢNH ĐẠI DIỆN TRONG FORM: có ảnh thì hiển thị ảnh, chưa có thì dùng chữ đầu hoten.
function Avatar({ user, large }) {
  return user.hinhanh ? (
    <Image source={{ uri: user.hinhanh }} style={[s.avatar, large && s.largeAvatar]} />
  ) : (
    <View style={[s.avatar, s.initial, large && s.largeAvatar]}>
      <Text style={{ color: '#4f46e5', fontSize: large ? 32 : 22, fontWeight: '800' }}>
        {(user.hoten || 'U')[0].toUpperCase()}
      </Text>
    </View>
  );
}

// 06. ĐIỀU KHIỂN ỨNG DỤNG: giữ trạng thái, gọi API và chọn màn hình cần hiển thị.
function Main() {
  // Phiên admin: token chỉ giữ trong bộ nhớ, tải lại app cần đăng nhập lại.
  const [token, setToken] = useState('');
  const tokenRef = useRef('');
  const [login, setLogin] = useState({ email: '', matkhau: '' });

  // Trạng thái đang xử lý và thông báo cho người dùng.
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Dữ liệu danh sách, từ khóa tìm kiếm và trang hiện tại.
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  // Form thêm/sửa và người dùng đang được chọn để sửa hoặc xóa.
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const requestId = useRef(0);

  // ĐĂNG XUẤT: xóa token và dữ liệu giao diện của phiên hiện tại.
  function logout() {
    tokenRef.current = '';
    setToken('');
    setData({ items: [], total: 0, pages: 1 });
    setForm(null);
    setDeleting(null);
    setLogin({ email: '', matkhau: '' });
    setSearch('');
    setPage(1);
    requestId.current++;
  }

  // GỌI API DÙNG CHUNG: gửi JSON/token, giới hạn chờ 20 giây và xử lý lỗi.
  // Nếu token hết hạn (401), tự đưa người dùng về màn hình đăng nhập.
  async function api(path, method = 'GET', body, signal, session = tokenRef.current) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort);
    const timer = setTimeout(abort, 20000);
    try {
      const response = await fetch(`${API}/api${path}`, {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = response.status === 204 ? null : await response.json();
      if (!response.ok) {
        if (response.status === 401 && session && tokenRef.current === session) logout();
        throw new Error(result?.message || 'Yêu cầu không thành công.');
      }
      return result;
    } catch (e) {
      if (e.name === 'TypeError')
        throw new Error(
          'Không kết nối được server. Kiểm tra địa chỉ API, Wi-Fi và server đang chạy.',
        );
      throw e;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }

  // TẢI DANH SÁCH: chạy lại khi đăng nhập, đổi trang, tìm kiếm hoặc yêu cầu tải lại.
  // Chờ 250ms khi gõ tìm kiếm; hủy yêu cầu cũ để tránh ghi đè kết quả mới.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      api(
        `/users?page=${page}&q=${encodeURIComponent(search)}`,
        'GET',
        null,
        controller.signal,
        token,
      )
        .then((result) => {
          if (id === requestId.current) {
            if (page > result.pages) setPage(result.pages);
            else setData(result);
          }
        })
        .catch((e) => {
          if (!controller.signal.aborted && id === requestId.current)
            setError(
              e.name === 'AbortError' ? 'Kết nối quá lâu. Nhấn Thử tải lại.' : e.message,
            );
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, page, search, reload]);

  // ĐĂNG NHẬP ADMIN: gửi email/matkhau và lưu token trả về khi thành công.
  async function signIn() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/auth/login', 'POST', login);
      tokenRef.current = result.token;
      setToken(result.token);
      setLogin({ email: '', matkhau: '' });
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Kết nối quá lâu. Hãy thử lại.' : e.message);
    } finally {
      setBusy(false);
    }
  }

  // MỞ FORM: không truyền user là thêm mới; truyền user là sửa hồ sơ có sẵn.
  // Khi sửa, để matkhau trống để server giữ nguyên mật khẩu cũ.
  function openEditor(user = null) {
    setEditing(user);
    setForm(
      user
        ? { hoten: user.hoten, email: user.email, matkhau: '', hinhanh: user.hinhanh }
        : { ...blank },
    );
    setFormError('');
    setShowPassword(false);
  }

  // CHỌN ẢNH: mở thư viện, thu nhỏ rộng 320px, nén JPEG và chuyển sang base64.
  async function pickImage() {
    setBusy(true);
    setFormError('');
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (picked.canceled) return;
      const context = ImageManipulator.manipulate(picked.assets[0].uri);
      context.resize({ width: 320 });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.65,
        base64: true,
      });
      const hinhanh = `data:image/jpeg;base64,${saved.base64}`;
      if (!saved.base64 || hinhanh.length > 200000)
        throw new Error('Ảnh vẫn quá lớn. Hãy chọn ảnh nhỏ hơn hoặc cắt ảnh vuông.');
      setForm((current) => (current ? { ...current, hinhanh } : current));
    } catch (e) {
      setFormError(e.message || 'Không đọc được ảnh. Hãy thử ảnh khác.');
    } finally {
      setBusy(false);
    }
  }

  // THÊM / SỬA: kiểm tra form, gọi POST hoặc PUT rồi tải lại danh sách.
  async function save() {
    const validation = validateUser(form, Boolean(editing));
    if (validation) {
      setFormError(validation);
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      await api(
        editing ? `/users/${editing._id}` : '/users',
        editing ? 'PUT' : 'POST',
        form,
      );
      setForm(null);
      setNotice(editing ? 'Đã cập nhật người dùng.' : 'Đã thêm người dùng.');
      setReload((n) => n + 1);
    } catch (e) {
      setFormError(
        e.name === 'AbortError'
          ? 'Hết thời gian chờ. Tải lại danh sách để kiểm tra trước khi lưu lại.'
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }

  // XÓA: chỉ chạy sau khi xác nhận trong hộp thoại; gọi DELETE rồi tải lại danh sách.
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await api(`/users/${deleting._id}`, 'DELETE');
      setDeleting(null);
      setNotice('Đã xóa người dùng.');
      setReload((n) => n + 1);
    } catch (e) {
      setDeleting(null);
      setError(
        e.name === 'AbortError'
          ? 'Hết thời gian chờ. Tải lại để kiểm tra kết quả.'
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      {/* Chưa đăng nhập: hiển thị form login. Đã đăng nhập: hiển thị bảng quản lý. */}
      {!token ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.loginWrap}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.loginCard}>
              <Text style={s.brand}>◈ MIDDLE EXAM</Text>
              <Text style={s.hero}>Nguyen Thi Minh Hau.{'\n'}23IT068.</Text>
              <View style={{ height: 30 }} />
              <Field
                label="Email admin"
                value={login.email}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onChangeText={(email) => setLogin({ ...login, email })}
                placeholder="admin@example.com"
              />
              <Field
                label="Mật khẩu"
                value={login.matkhau}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onChangeText={(matkhau) => setLogin({ ...login, matkhau })}
                placeholder="Nhập mật khẩu admin"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Text style={s.link}>
                  {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                </Text>
              </Pressable>
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
              <Button
                title={busy ? 'Đang đăng nhập…' : 'Đăng nhập →'}
                onPress={signIn}
                disabled={busy || !login.email || !login.matkhau}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={s.container}>
          <View style={s.topbar}>
            <Text style={s.brand}>◈ MIDDLE EXAM</Text>
            <Pressable disabled={busy} onPress={logout}>
              <Text style={s.link}>Đăng xuất</Text>
            </Pressable>
          </View>
          {/* Nối thao tác trên bảng với các hàm thêm, sửa, xóa và tìm kiếm ở trên. */}
          <UserDirectory
            data={data}
            search={search}
            page={page}
            loading={loading}
            busy={busy}
            notice={notice}
            error={error}
            onSearch={(text) => {
              setSearch(text);
              setPage(1);
              setNotice('');
            }}
            onPage={setPage}
            onRefresh={() => setReload((n) => n + 1)}
            onAdd={() => openEditor()}
            onEdit={openEditor}
            onDelete={setDeleting}
          />
        </View>
      )}
      {/* FORM THÊM / SỬA: ảnh đại diện, hoten, email, matkhau và nút Lưu / Hủy. */}
      <Modal
        visible={Boolean(form)}
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setForm(null);
        }}
      >
        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.editor}
            >
              <Text style={s.eyebrow}>HỒ SƠ NGƯỜI DÙNG</Text>
              <Text style={s.title}>
                {editing ? 'Chỉnh sửa hồ sơ' : 'Thêm người dùng'}
              </Text>
              <Text style={s.muted}>Điền thông tin và chọn ảnh đại diện.</Text>
              {form && (
                <>
                  <View style={s.photoArea}>
                    <Avatar user={form} large />
                    <View style={s.actions}>
                      <Button
                        secondary
                        title="Chọn ảnh"
                        disabled={busy}
                        onPress={pickImage}
                      />
                      {!!form.hinhanh && (
                        <Button
                          secondary
                          title="Bỏ ảnh"
                          disabled={busy}
                          onPress={() => setForm({ ...form, hinhanh: '' })}
                        />
                      )}
                    </View>
                  </View>
                  <Field
                    label="Họ tên"
                    value={form.hoten}
                    editable={!busy}
                    autoCapitalize="none"
                    maxLength={100}
                    onChangeText={(hoten) => setForm({ ...form, hoten })}
                    placeholder="Ví dụ: Nguyễn Văn An"
                  />
                  <Field
                    label="Email"
                    value={form.email}
                    editable={!busy}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    maxLength={254}
                    onChangeText={(email) => setForm({ ...form, email })}
                    placeholder="vana@example.com"
                  />
                  <Field
                    label={editing ? 'Mật khẩu mới (để trống để giữ nguyên)' : 'Mật khẩu'}
                    value={form.matkhau}
                    editable={!busy}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    maxLength={128}
                    onChangeText={(matkhau) => setForm({ ...form, matkhau })}
                    placeholder="Tối thiểu 8 ký tự"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)}>
                    <Text style={s.link}>
                      {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    </Text>
                  </Pressable>
                  {!!formError && (
                    <Text accessibilityRole="alert" style={s.error}>
                      {formError}
                    </Text>
                  )}
                  <View style={s.actions}>
                    <Button
                      title={busy ? 'Đang xử lý…' : 'Lưu người dùng'}
                      disabled={busy}
                      onPress={save}
                    />
                    <Button
                      secondary
                      title="Hủy"
                      disabled={busy}
                      onPress={() => setForm(null)}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      {/* XÁC NHẬN XÓA: chỉ gọi remove() khi người dùng bấm nút Xóa trong hộp thoại. */}
      <Modal
        transparent
        visible={Boolean(deleting)}
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setDeleting(null);
        }}
      >
        <View style={s.overlay}>
          <View style={s.dialog}>
            <Text style={s.cardTitle}>Xóa người dùng?</Text>
            <Text style={[s.muted, { marginVertical: 18 }]}>
              Hồ sơ {deleting?.hoten} sẽ bị xóa vĩnh viễn.
            </Text>
            <View style={s.actions}>
              <Button
                danger
                title={busy ? 'Đang xóa…' : 'Xóa người dùng'}
                disabled={busy}
                onPress={remove}
              />
              <Button
                secondary
                title="Hủy"
                disabled={busy}
                onPress={() => setDeleting(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
// 07. ĐIỂM VÀO GIAO DIỆN: SafeAreaProvider giúp nội dung tránh vùng camera/thanh hệ thống.
export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}
// MÀU SẮC / FONT / BỐ CỤC: đăng nhập, form thêm sửa và hộp xác nhận.
const s = StyleSheet.create({
  // Khung màn hình, thanh đầu trang và chữ tiêu đề.
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 22,
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f4f7',
  },
  brand: { color: '#4f46e5', fontWeight: '900', letterSpacing: 2, fontSize: 15 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#18233b', marginBottom: 8 },
  hero: {
    fontSize: 34,
    fontWeight: '800',
    color: '#18233b',
    lineHeight: 43,
    marginTop: 28,
    marginBottom: 12,
  },
  muted: { color: '#64748b', fontSize: 14, lineHeight: 22 },
  // Bố cục và khung đăng nhập.
  loginWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: 'white',
    padding: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#e6eaf2',
  },
  // Nhãn và ô nhập dữ liệu trong form.
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dce2ed',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: '#18233b',
    fontSize: 15,
    minHeight: 50,
  },
  // Màu nền, cỡ chữ và bo góc của các nút trong form.
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  secondary: { backgroundColor: '#e9edf5' },
  danger: { backgroundColor: '#dc354b' },
  link: { color: '#4f46e5', fontWeight: '700', paddingVertical: 8 },
  deleteLink: { color: '#dc354b', fontWeight: '700', paddingVertical: 8 },
  footnote: { color: '#94a3b8', fontSize: 11, lineHeight: 18, marginVertical: 20 },
  stats: {
    marginVertical: 22,
    padding: 22,
    backgroundColor: '#eef0ff',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statNumber: { fontSize: 34, fontWeight: '800', color: '#3730a3' },
  badge: { backgroundColor: 'white', padding: 10, borderRadius: 10 },
  badgeText: { color: '#4f46e5', fontSize: 11, fontWeight: '800' },
  tools: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e6eaf2',
    marginBottom: 12,
  },
  userLine: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#e9e8ff' },
  largeAvatar: { width: 100, height: 100, borderRadius: 30 },
  initial: { justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#18233b', marginBottom: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f1f3f8',
    marginTop: 14,
    paddingTop: 8,
  },
  passwordLabel: { fontSize: 12, color: '#94a3b8' },
  actions: { flexDirection: 'row', gap: 20, alignItems: 'center', flexWrap: 'wrap' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  // Bố cục form thêm/sửa và vùng chọn ảnh.
  editor: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    padding: 26,
    paddingBottom: 50,
  },
  photoArea: { alignItems: 'center', gap: 14, marginVertical: 26 },
  error: {
    color: '#bf2340',
    backgroundColor: '#fff0f2',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    lineHeight: 21,
  },
  success: {
    color: '#087f5b',
    padding: 10,
    backgroundColor: '#e6fcf5',
    borderRadius: 10,
    marginBottom: 12,
  },
  empty: { alignItems: 'center', paddingVertical: 44, gap: 10 },
  // Lớp nền tối và hộp thoại xác nhận xóa.
  overlay: {
    flex: 1,
    backgroundColor: '#18233b80',
    justifyContent: 'center',
    padding: 26,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 26,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
});

// MÀU SẮC / FONT / BỐ CỤC: bảng người dùng, nút Thêm / Sửa / Xóa.
const tableStyles = StyleSheet.create({
  // MÀU HOVER: Thêm xanh lá, Sửa xanh dương, Xóa đỏ; whiteText là màu chữ khi hover.
  addHover: { backgroundColor: '#16a34a' },
  editHover: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  deleteHover: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  whiteText: { color: '#fff' },
  pageHover: { backgroundColor: '#f2f4f7', borderColor: '#98a2b3' },
  actionHeading: { width: 46, textAlign: 'center' },
  wideActions: { width: 200, gap: 24 },
  wideActionCell: { width: 70 },
  // Khung bảng và cách sắp xếp thanh công cụ trên web/điện thoại.
  directory: { flex: 1, paddingTop: 22 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 24,
  },
  toolbarCompact: { alignItems: 'stretch', flexDirection: 'column', gap: 18 },
  // Font chữ và màu của tiêu đề / tổng số người dùng.
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#101828', fontSize: 20, fontWeight: '700' },
  count: { color: '#98a2b3', fontSize: 20, fontWeight: '500' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    maxWidth: 460,
  },
  controlsCompact: {
    maxWidth: undefined,
    flex: undefined,
    width: '100%',
    flexWrap: 'wrap',
  },
  // Ô tìm kiếm: viền, nền, biểu tượng và chữ nhập.
  searchBox: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    minHeight: 42,
  },
  searchIcon: { color: '#98a2b3', fontSize: 25, marginRight: 8, lineHeight: 30 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#101828',
    paddingVertical: 10,
    minWidth: 0,
  },
  // Nút Thêm khi CHƯA hover: nền, bo góc và màu chữ.
  addButton: {
    minHeight: 42,
    justifyContent: 'center',
    backgroundColor: '#17191c',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  // Tiêu đề bảng và độ rộng các cột Họ tên / Email / Sửa / Xóa.
  table: { flex: 1 },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fb',
    borderRadius: 8,
  },
  columnLabel: { color: '#667085', fontSize: 12, fontWeight: '500' },
  nameColumn: { flex: 1.05, paddingRight: 18, minWidth: 0 },
  emailColumn: { flex: 1, paddingRight: 16, minWidth: 0 },
  mobileName: { flex: 1, paddingRight: 8 },
  actionColumn: { width: 106, alignItems: 'flex-end', textAlign: 'right' },
  // Các hàng dữ liệu, avatar và chữ hoten/email.
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eaecf0',
    backgroundColor: '#fff',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f2f4f7' },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2f6',
  },
  initial: { color: '#475467', fontSize: 16, fontWeight: '600' },
  nameText: { flex: 1, minWidth: 0 },
  hoten: { color: '#101828', fontSize: 14, fontWeight: '600' },
  email: { color: '#667085', fontSize: 14 },
  mobileEmail: { color: '#667085', fontSize: 12, marginTop: 4 },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { color: '#667085', fontSize: 25, lineHeight: 28 },
  morePressed: { backgroundColor: '#f2f4f7' },
  // Nút và nhãn phân trang.
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 20,
  },
  pageLabel: { fontSize: 12, color: '#667085' },
  pageButtons: { flexDirection: 'row', gap: 8 },
  pageButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  pageButtonText: { color: '#344054', fontSize: 12, fontWeight: '600' },
  dim: { opacity: 0.4 },
  loader: { margin: 12 },
  // Trạng thái danh sách trống và các thông báo thành công/lỗi.
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { color: '#344054', fontSize: 16, fontWeight: '600' },
  emptyDescription: { color: '#667085', fontSize: 13, textAlign: 'center' },
  success: {
    padding: 12,
    borderRadius: 8,
    color: '#067647',
    backgroundColor: '#ecfdf3',
    fontSize: 13,
    marginBottom: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff1f3',
    marginBottom: 16,
  },
  error: { color: '#b42318', fontSize: 13, lineHeight: 20 },
  retry: { color: '#b42318', fontWeight: '600', marginTop: 8 },
  // Hai nút Sửa / Xóa khi CHƯA hover: vị trí, viền, nền và màu chữ.
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 7,
    minHeight: 40,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  editText: { color: '#344054', fontSize: 13, fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#fecdca',
    borderRadius: 7,
    minHeight: 40,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  deleteText: { color: '#d92d20', fontSize: 13, fontWeight: '600' },
});

// HIỆU ỨNG NÚT: tốc độ chuyển màu, nhấn và trạng thái vô hiệu hóa.
const hoverStyles = StyleSheet.create({
  // Chuyển màu nền/viền trên web; tăng transitionDuration nếu muốn chậm hơn.
  transition: {
    transitionProperty: 'background-color, border-color, transform, opacity',
    transitionDuration: '150ms',
  },
  // Tốc độ đổi màu chữ khi hover.
  textTransition: { transitionProperty: 'color', transitionDuration: '150ms' },
  // Thu nhỏ nhẹ khi nhấn; disabled làm mờ nút không thể bấm.
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.4 },
});

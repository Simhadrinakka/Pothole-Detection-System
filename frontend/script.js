const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");
const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");
const authAlert = document.getElementById("authAlert");
const socialButtons = document.querySelectorAll(".social-btn");

const appContent = document.getElementById("appContent");
const logoutBtn = document.getElementById("logoutBtn");
const uploadInput = document.getElementById("imageUpload");
const detectBtn = document.getElementById("detectBtn");
const potholeCount = document.getElementById("potholeCount");
const accuracyText = document.getElementById("accuracy");
const uploadedImage = document.getElementById("uploadedImage");
const detectedImage = document.getElementById("detectedImage");
const heatmapImage = document.getElementById("heatmapImage");

const API_BASE_URL = "http://127.0.0.1:5000";
const USERS_STORAGE_KEY = "aiml_project_users";
const SESSION_STORAGE_KEY = "aiml_project_session";
const DASHBOARD_PAGE = "dashboard.html";
const LOGIN_PAGE = "index.html";

const getUsers = () => {
    try {
        return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
};

const saveUsers = (users) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const setSession = (user) => {
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            name: user.name,
            email: user.email
        }));
    } catch {
        // Continue without storage when browser blocks sessionStorage.
    }
};

const clearSession = () => {
    try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
        // Ignore storage errors and still allow navigation.
    }
};

const getSession = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || "null");
    } catch {
        return null;
    }
};

const showAlert = (message, type = "error") => {
    if (!authAlert) {
        alert(message);
        return;
    }

    authAlert.textContent = message;
    authAlert.dataset.type = type;
    authAlert.classList.remove("hidden");
};

const clearAlert = () => {
    if (authAlert) {
        authAlert.textContent = "";
        authAlert.classList.add("hidden");
        delete authAlert.dataset.type;
    }
};

const setActiveAuthForm = (target) => {
    authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authTab === target));
    authForms.forEach((form) => form.classList.toggle("active", form.id === `${target}Form`));
};

const authPage = Boolean(signinForm && signupForm);
const dashboardPage = Boolean(appContent && detectBtn && uploadInput);

if (authPage) {
    if (getSession()) {
        window.location.href = DASHBOARD_PAGE;
    }

    socialButtons.forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href = DASHBOARD_PAGE;
        });
    });

    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            clearAlert();
            setActiveAuthForm(tab.dataset.authTab);
        });
    });

    signinForm.addEventListener("submit", (event) => {
        event.preventDefault();

        window.location.href = DASHBOARD_PAGE;
    });

    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        clearAlert();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const password = document.getElementById("signupPassword").value;

        if (!name || !email || !password) {
            showAlert("Please fill in all sign-up fields.");
            return;
        }

        const users = getUsers();
        const existingUser = users.find((entry) => entry.email === email);

        if (existingUser) {
            showAlert("This email is already registered. Please sign in instead.");
            setActiveAuthForm("signin");
            document.getElementById("signinEmail").value = email;
            return;
        }

        users.push({ name, email, password });
        saveUsers(users);
        setSession({ name, email });
        window.location.href = DASHBOARD_PAGE;
    });

    setActiveAuthForm("signin");
}

if (dashboardPage) {
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearSession();
            window.location.href = LOGIN_PAGE;
        });
    }

    const hideImage = (imgEl) => {
        imgEl.classList.add("hidden");
        imgEl.removeAttribute("src");
    };

    const showImage = (imgEl, src) => {
        imgEl.src = src;
        imgEl.classList.remove("hidden");
    };

    const scrollToDetect = () => {
        document.getElementById("detect-section").scrollIntoView({
            behavior: "smooth"
        });
    };

    window.scrollToDetect = scrollToDetect;

    uploadInput.addEventListener("change", () => {
        const file = uploadInput.files[0];

        if (file) {
            showImage(uploadedImage, URL.createObjectURL(file));
        } else {
            hideImage(uploadedImage);
        }

        hideImage(detectedImage);
        if (heatmapImage) {
            hideImage(heatmapImage);
        }
    });

    const scrollToHeatmap = () => {
        const heatmapSection = document.getElementById("heatmap-section");

        if (heatmapSection) {
            heatmapSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };

    detectBtn.addEventListener("click", async () => {
        const file = uploadInput.files[0];

        if (!file) {
            alert("Please upload an image first!");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            detectBtn.innerText = "Detecting...";
            detectBtn.disabled = true;

            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: "POST",
                body: formData
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Prediction request failed");
            }

            if (data.error) {
                alert(data.error);
                return;
            }

            potholeCount.innerText = data.count ?? 0;
            accuracyText.innerText = `${data.accuracy ?? 0}%`;
            showImage(detectedImage, `${data.image_url}?t=${Date.now()}`);

            if (heatmapImage && data.heatmap_url) {
                showImage(heatmapImage, `${data.heatmap_url}?t=${Date.now()}`);
                scrollToHeatmap();
            }
        } catch (error) {
            console.error("Detection error:", error);
            alert(error.message || "Error connecting to backend!");
        } finally {
            detectBtn.innerText = "Detect Potholes";
            detectBtn.disabled = false;
        }
    });
}

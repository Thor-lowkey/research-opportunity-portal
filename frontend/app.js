
const API_URL = "/api/opportunities";

const list = document.getElementById("opportunities-list");
const message = document.getElementById("message");
const formSection = document.getElementById("form-section");
const opportunityForm = document.getElementById("opportunity-form");
const showFormBtn = document.getElementById("show-form-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");

let editingOpportunityId = null;

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `message ${type}`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

async function loadOpportunities() {
    list.innerHTML = "<p>Loading opportunities...</p>";

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Could not load opportunities.");

        const opportunities = await response.json();

        if (opportunities.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>No opportunities yet</h3>
                    <p>Add the first research opportunity to get started.</p>
                </div>`;
            return;
        }

        list.innerHTML = opportunities.map(opportunity => `
            <article class="opportunity-card">
                <h3>${escapeHTML(opportunity.title)}</h3>
                <span class="status ${opportunity.status === "Open" ? "status-open" : "status-closed"}">
                    ${escapeHTML(opportunity.status)}
                </span>
                <p>${escapeHTML(opportunity.description || "No description provided.")}</p>
                <p><strong>Research Area:</strong> ${escapeHTML(opportunity.research_area || "Not specified")}</p>
                <p><strong>Faculty:</strong> ${escapeHTML(opportunity.faculty_member || "Not specified")}</p>
                <p><strong>Department:</strong> ${escapeHTML(opportunity.department || "Not specified")}</p>
                <p><strong>Positions:</strong> ${escapeHTML(opportunity.available_positions)}</p>
                <p><strong>Skills:</strong> ${escapeHTML(opportunity.required_skills || "Not specified")}</p>
                <p><strong>Deadline:</strong> ${escapeHTML(
                    opportunity.application_deadline
                        ? String(opportunity.application_deadline).slice(0, 16)
                        : "Not specified"
                )}</p>
                <div class="card-actions">
                    <button class="secondary-btn" data-action="details" data-id="${opportunity.id}">Details</button>
                    <button class="secondary-btn" data-action="edit" data-id="${opportunity.id}">Edit</button>
                    <button class="secondary-btn" data-action="toggle" data-id="${opportunity.id}">
                        Mark ${opportunity.status === "Open" ? "Closed" : "Open"}
                    </button>
                    <button class="delete-btn" data-action="delete" data-id="${opportunity.id}">Delete</button>
                </div>
            </article>
        `).join("");
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state">
                Could not load opportunities. Check that Flask is running.
            </div>`;
        showMessage(error.message, "error");
    }
}

function resetForm() {
    opportunityForm.reset();
    editingOpportunityId = null;
    formTitle.textContent = "Add an Opportunity";
    saveBtn.textContent = "Save Opportunity";
    opportunityForm.elements.status.value = "Open";
    opportunityForm.elements.available_positions.value = 1;
}

showFormBtn.addEventListener("click", () => {
    resetForm();
    formSection.hidden = false;
    formSection.scrollIntoView({ behavior: "smooth" });
});

cancelBtn.addEventListener("click", () => {
    formSection.hidden = true;
    resetForm();
});

opportunityForm.addEventListener("submit", async event => {
    event.preventDefault();

    const formData = new FormData(opportunityForm);

    const data = {
        title: formData.get("title").trim(),
        description: formData.get("description").trim(),
        research_area: formData.get("research_area").trim(),
        faculty_member: formData.get("faculty_member").trim(),
        department: formData.get("department").trim(),
        required_skills: formData.get("required_skills")
            .split(",").map(skill => skill.trim()).filter(Boolean),
        available_positions: Number(formData.get("available_positions")),
        application_deadline: formData.get("application_deadline") || null,
        status: formData.get("status")
    };

    const isEditing = editingOpportunityId !== null;
    const url = isEditing ? `${API_URL}/${editingOpportunityId}` : API_URL;

    try {
        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not save opportunity.");

        showMessage(
            isEditing ? "Opportunity updated successfully!" : "Opportunity created successfully!",
            "success"
        );

        formSection.hidden = true;
        resetForm();
        await loadOpportunities();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

list.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    try {
        if (action === "details") {
            const response = await fetch(`${API_URL}/${id}`);
            const opportunity = await response.json();
            if (!response.ok) throw new Error(opportunity.error || "Could not load details.");

            alert(
                `Title: ${opportunity.title}\n\n` +
                `Description: ${opportunity.description || "Not specified"}\n` +
                `Research Area: ${opportunity.research_area || "Not specified"}\n` +
                `Faculty: ${opportunity.faculty_member || "Not specified"}\n` +
                `Department: ${opportunity.department || "Not specified"}\n` +
                `Required Skills: ${opportunity.required_skills || "Not specified"}\n` +
                `Available Positions: ${opportunity.available_positions}\n` +
                `Deadline: ${opportunity.application_deadline || "Not specified"}\n` +
                `Status: ${opportunity.status}`
            );
        }

        if (action === "edit") {
            const response = await fetch(`${API_URL}/${id}`);
            const opportunity = await response.json();
            if (!response.ok) throw new Error(opportunity.error || "Could not load opportunity.");

            editingOpportunityId = opportunity.id;
            opportunityForm.elements.title.value = opportunity.title || "";
            opportunityForm.elements.description.value = opportunity.description || "";
            opportunityForm.elements.research_area.value = opportunity.research_area || "";
            opportunityForm.elements.faculty_member.value = opportunity.faculty_member || "";
            opportunityForm.elements.department.value = opportunity.department || "";
            opportunityForm.elements.required_skills.value = opportunity.required_skills || "";
            opportunityForm.elements.available_positions.value = opportunity.available_positions;
            opportunityForm.elements.application_deadline.value =
                opportunity.application_deadline
                    ? new Date(opportunity.application_deadline).toISOString().slice(0, 10)
                    : "";
            opportunityForm.elements.status.value = opportunity.status;

            formTitle.textContent = "Edit Opportunity";
            saveBtn.textContent = "Update Opportunity";
            formSection.hidden = false;
            formSection.scrollIntoView({ behavior: "smooth" });
        }

        if (action === "toggle") {
            const response = await fetch(`${API_URL}/${id}`);
            const opportunity = await response.json();
            if (!response.ok) throw new Error(opportunity.error || "Could not load opportunity.");

            const updateResponse = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: opportunity.status === "Open" ? "Closed" : "Open"
                })
            });

            const result = await updateResponse.json();
            if (!updateResponse.ok) throw new Error(result.error || "Could not change status.");

            showMessage("Opportunity status updated!", "success");
            await loadOpportunities();
        }

        if (action === "delete") {
            if (!confirm("Are you sure you want to delete this opportunity?")) return;

            const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not delete opportunity.");

            showMessage("Opportunity deleted successfully!", "success");
            await loadOpportunities();
        }
    } catch (error) {
        showMessage(error.message, "error");
    }
});

loadOpportunities();

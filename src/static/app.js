document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Build a single participant <li> with a delete button
  function createParticipantItem(activityName, email) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "participant-email";
    span.textContent = email;

    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.title = "Unregister";
    btn.innerHTML = "&#x1F5D1;";
    btn.addEventListener("click", async () => {
      try {
        const res = await fetch(
          `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          // Re-fetch only this activity and update its card in-place
          const allActivities = await (await fetch("/activities")).json();
          const updatedDetails = allActivities[activityName];
          const oldCard = activitiesList.querySelector(`[data-activity-name="${CSS.escape(activityName)}"]`);
          if (oldCard && updatedDetails) {
            const newCard = buildActivityCard(activityName, updatedDetails);
            activitiesList.replaceChild(newCard, oldCard);
          }
        }
      } catch (error) {
        console.error("Error unregistering participant:", error);
      }
    });

    li.appendChild(span);
    li.appendChild(btn);
    return li;
  }

  // Build a complete activity card element
  function buildActivityCard(name, details) {
    const card = document.createElement("div");
    card.className = "activity-card";
    card.dataset.activityName = name;

    const spotsLeft = details.max_participants - details.participants.length;

    const title = document.createElement("h4");
    title.textContent = name;

    const desc = document.createElement("p");
    desc.textContent = details.description;

    const schedule = document.createElement("p");
    schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

    const availability = document.createElement("p");
    availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

    const section = document.createElement("div");
    section.className = "participants-section";

    const sectionTitle = document.createElement("p");
    sectionTitle.className = "participants-title";
    sectionTitle.textContent = `Participants (${details.participants.length}/${details.max_participants}):`;

    const ul = document.createElement("ul");
    ul.className = "participants-list";

    if (details.participants.length > 0) {
      details.participants.forEach(email => ul.appendChild(createParticipantItem(name, email)));
    } else {
      const li = document.createElement("li");
      li.className = "no-participants";
      li.textContent = "No participants yet";
      ul.appendChild(li);
    }

    section.appendChild(sectionTitle);
    section.appendChild(ul);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(schedule);
    card.appendChild(availability);
    card.appendChild(section);
    return card;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        activitiesList.appendChild(buildActivityCard(name, details));

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Update the affected activity card in-place
        const allActivities = await (await fetch("/activities")).json();
        const updatedDetails = allActivities[activity];
        const oldCard = activitiesList.querySelector(`[data-activity-name="${CSS.escape(activity)}"]`);
        if (oldCard && updatedDetails) {
          activitiesList.replaceChild(buildActivityCard(activity, updatedDetails), oldCard);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

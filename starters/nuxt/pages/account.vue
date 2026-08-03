<script setup>
definePageMeta({ middleware: "gated" });

const { $memberstack } = useNuxtApp();
const { member, status, error, refresh } = useMember();

const first = ref("");
const last = ref("");
const saved = ref(false);
const saveError = ref("");
const busy = ref(false);

// Seed the form once the member arrives, and again if they change. The guard
// keeps this from clobbering whatever the person is typing.
watch(
  member,
  (value) => {
    if (!value) return;
    first.value = value.customFields?.["first-name"] ?? "";
    last.value = value.customFields?.["last-name"] ?? "";
  },
  { immediate: true }
);

const plans = computed(
  () => member.value?.planConnections?.filter((plan) => plan.active) ?? []
);

const save = async () => {
  busy.value = true;
  saved.value = false;
  saveError.value = "";
  try {
    // updateMember takes the whole customFields object. Keys missing from your
    // dashboard are dropped silently, same as at signup.
    await $memberstack.updateMember({
      customFields: { "first-name": first.value, "last-name": last.value },
    });
    await refresh();
    saved.value = true;
  } catch (err) {
    saveError.value = err?.message || "Could not save those changes.";
  }
  busy.value = false;
};
</script>

<template>
  <!-- ClientOnly for the same reason as members.vue and the nav: the server
       cannot know who is signed in, so it renders the signed-out branch while
       the client renders the signed-in one, and Nuxt reports a hydration
       mismatch. Empty fallback, so no flash of the wrong state. -->
  <ClientOnly>
  <p v-if="error" class="notice">Could not reach Memberstack: {{ error }}</p>

  <div v-else-if="status === 'in' && member" class="auth">
    <span class="eyebrow">Account</span>
    <h1>Your details</h1>
    <p class="sub">
      This reads and writes the same custom fields your signup form collected.
    </p>

    <div class="card">
      <p v-if="saveError" class="err">{{ saveError }}</p>
      <p v-if="saved" class="ok">Saved.</p>

      <form @submit.prevent="save">
        <div class="row">
          <div>
            <label for="first">First name</label>
            <input id="first" v-model="first" />
          </div>
          <div>
            <label for="last">Last name</label>
            <input id="last" v-model="last" />
          </div>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="busy">
          {{ busy ? "Saving…" : "Save changes" }}
        </button>
      </form>
    </div>

    <div class="card" style="margin-top: 16px">
      <h2>Membership</h2>
      <dl class="dl">
        <div>
          <dt>Email</dt>
          <dd>{{ member.auth?.email }}</dd>
        </div>
        <div>
          <dt>Member ID</dt>
          <dd>{{ member.id }}</dd>
        </div>
        <div>
          <dt>Plan</dt>
          <dd>
            {{ plans.length ? plans.map((p) => p.planId).join(", ") : "None" }}
          </dd>
        </div>
      </dl>

      <p v-if="!plans.length" class="hint">
        No plan is needed — this site gates on being signed in. To gate on a
        plan instead, pass <code>plans</code> at signup or call
        <code>addPlan()</code>.
      </p>
    </div>
  </div>
  </ClientOnly>
</template>

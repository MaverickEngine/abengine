import AdminCampaigns from './admin-campaigns/admin-campaigns.svelte';

const app = new AdminCampaigns({
	target: document.getElementById("abengineAdminCampaigns"),
	props: {
	}
});

export default app;
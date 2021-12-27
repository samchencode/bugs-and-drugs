import App from '@/view/App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'bugs and drugs'
	}
});

export default app;
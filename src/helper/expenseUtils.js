import supabase from './supabaseClient';



export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function addCategory(name, color = '#6366f1') {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, color, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}


export async function getExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      categories (
        id,
        name,
        color
      )
    `)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addExpense({ amount, description, category_id, date, tags }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      amount,
      description,
      category_id: category_id || null,
      date,
      tags: tags || [],
      user_id: user.id
    })
    .select(`*, categories(id, name, color)`)
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id, { amount, description, category_id, date, tags }) {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      amount,
      description,
      category_id: category_id || null,
      date,
      tags: tags || []
    })
    .eq('id', id)
    .select(`*, categories(id, name, color)`)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
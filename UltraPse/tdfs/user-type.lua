--[[
	This file gives an example for user-defined types.
	The MOD_TYPE class describes a new sequecne type, which contain 21 different letters. (20 amino acids + the '@')
	The additional letter can be used to represent a kind of modified residues.
	With additional values in H1, H2 and MASS values, UltraPse can process this new type of sequence and generate PseAAC-like sequence
	representations, which will have 21 + \lambda dimensions for Type 1 and 21 + 2 * \lambda dimensions for Type 2.

	The testing data is the user-type.fas in test directory.
--]]

H1 = {
	Template="";
	ID = "CPSEH1";
	Values =
	{
		A = 0.62;	C = 0.29;	D = -0.9;	E = -0.74;
		F = 1.19;	G = 0.48;	H = -0.4;	I = 1.38;
		K = -1.5;	L = 1.06;	M = 0.64;	N = -0.78;
		P = 0.12;	Q = -0.85;	R = -2.53;	S = -0.18;
		T = -0.05;	V = 1.08;	W = 0.81;	Y = 0.26;
		["@"] = 1.7;
	};
	Comment = "H1 in Classic PseAAC";
};

H2 = {
	Template="";
	ID = "CPSEH2";
	Values =
	{
		A = -0.5;	C = -1.0;	D = 3.0;	E = 3.0;
		F = -2.5;	G = 0.0;	H = -0.5;	I = -1.8;
		K = 3.0;	L = -1.8;	M = -1.3;	N = 0.2;
		P = 0.0;	Q = 0.2;	R = 3.0;	S = 0.3;
		T = -0.4;	V = -1.5;	W = -3.4;	Y = -2.3;
		["@"] = 0.6;
	};
	Comment = "H2 in Classic PseAAC";
};

MASS = {
	Template="";
	ID = "CPSEM";
	Values =
	{
		A = 15;	C = 47;	D = 59;	E = 73;
		F = 91; G = 1;	H = 82; I = 57;
		K = 73; L = 57; M = 75; N = 58;
		P = 42; Q = 72; R = 101; S = 31;
		T = 45; V = 43; W = 130; Y = 107;
		["@"] = 109;
	};
	Comment = "Mass in Classic PseAAC";
};

USER_TYPE = {
	Name = "MOD_TYPE";
	Base = "ACDEFGHIKLMNPQRSTVWY@";
	Length = 1;
	ReduceMap = "";
};

DefineNotation(USER_TYPE)
SetNotation("MOD_TYPE")
DefineProperty(H1)
DefineProperty(H2)
DefineProperty(MASS)
AddProperty("CPSEH1")
AddProperty("CPSEH2")
if (GetOption("_cmd_subtype") == "1") then
	AddProperty("CPSEM")
end

